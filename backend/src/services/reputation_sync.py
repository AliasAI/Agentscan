"""Reputation Sync Service

This service synchronizes reputation scores from the ReputationRegistry contract.
"""

from datetime import datetime
import asyncio
import structlog
from web3 import Web3
from sqlalchemy.orm import Session

from src.db.database import SessionLocal
from src.models import Agent, Activity, ActivityType
from src.core.reputation_config import (
    REPUTATION_REGISTRY_ADDRESS,
    REPUTATION_REGISTRY_ABI,
)
from src.core.blockchain_config import SEPOLIA_RPC_URL

logger = structlog.get_logger(__name__)

# 并发配置
BATCH_SIZE = 50  # 每批处理的 agent 数量
MAX_CONCURRENT_REQUESTS = 10  # 最大并发请求数


class ReputationSyncService:
    """Service for syncing reputation scores from blockchain"""

    def __init__(self):
        """Initialize the reputation sync service"""
        self.w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
        self.contract = self.w3.eth.contract(
            address=REPUTATION_REGISTRY_ADDRESS,
            abi=REPUTATION_REGISTRY_ABI
        )
        logger.info(
            "reputation_sync_initialized",
            reputation_registry=REPUTATION_REGISTRY_ADDRESS,
            identity_registry=self.contract.functions.getIdentityRegistry().call()
        )

    async def sync(self):
        """Sync reputation scores for all agents with concurrent requests"""
        db = SessionLocal()
        try:
            logger.info("reputation_sync_started")

            # Get all agents with token_id
            agents = db.query(Agent).filter(Agent.token_id.isnot(None)).all()
            total_agents = len(agents)
            logger.info("reputation_sync_agents_found", count=total_agents)

            updated_count = 0
            error_count = 0

            # 创建信号量来限制并发数
            semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

            # 分批处理
            for i in range(0, total_agents, BATCH_SIZE):
                batch = agents[i:i + BATCH_SIZE]
                batch_num = i // BATCH_SIZE + 1
                total_batches = (total_agents + BATCH_SIZE - 1) // BATCH_SIZE

                logger.info(
                    "reputation_sync_batch_started",
                    batch=batch_num,
                    total_batches=total_batches,
                    batch_size=len(batch)
                )

                # 并发处理当前批次
                tasks = []
                for agent in batch:
                    task = self._update_agent_reputation_with_semaphore(
                        semaphore, db, agent
                    )
                    tasks.append(task)

                # 等待当前批次完成
                results = await asyncio.gather(*tasks, return_exceptions=True)

                # 统计结果
                for result in results:
                    if isinstance(result, Exception):
                        error_count += 1
                    else:
                        updated_count += 1

                logger.info(
                    "reputation_sync_batch_completed",
                    batch=batch_num,
                    processed=i + len(batch),
                    total=total_agents
                )

            logger.info(
                "reputation_sync_completed",
                updated=updated_count,
                errors=error_count,
                total=total_agents
            )

        except Exception as e:
            logger.error("reputation_sync_error", error=str(e))
            raise
        finally:
            db.close()

    async def _update_agent_reputation_with_semaphore(
        self, semaphore: asyncio.Semaphore, db: Session, agent: Agent
    ):
        """Update agent reputation with semaphore control"""
        async with semaphore:
            try:
                await self._update_agent_reputation(db, agent)
            except Exception as e:
                logger.warning(
                    "reputation_update_failed",
                    token_id=agent.token_id,
                    agent_id=agent.id,
                    error=str(e)
                )
                raise

    async def _update_agent_reputation(self, db: Session, agent: Agent):
        """Update reputation score for a single agent"""
        try:
            # Call getSummary(agentId, [], 0, 0) in thread pool
            # Empty array = all clients, 0 bytes = all tags
            count, average_score = await asyncio.to_thread(
                self.contract.functions.getSummary(
                    agent.token_id,
                    [],  # All clients
                    b'\x00' * 32,  # tag1 = 0 (no filter)
                    b'\x00' * 32   # tag2 = 0 (no filter)
                ).call
            )

            # Only update if there's actual feedback
            if count > 0:
                old_score = agent.reputation_score
                agent.reputation_score = float(average_score)
                agent.reputation_count = int(count)
                agent.reputation_last_updated = datetime.utcnow()

                db.commit()

                # Create activity record if score changed
                if old_score != float(average_score):
                    activity = Activity(
                        agent_id=agent.id,
                        activity_type=ActivityType.REPUTATION_UPDATE,
                        description=f"Reputation updated: {old_score:.1f} → {average_score:.1f} ({count} reviews)",
                        tx_hash=None
                    )
                    db.add(activity)
                    db.commit()

                logger.info(
                    "reputation_updated",
                    token_id=agent.token_id,
                    agent_name=agent.name,
                    score=average_score,
                    count=count
                )
            else:
                # No feedback yet, keep existing score
                logger.debug(
                    "no_reputation_data",
                    token_id=agent.token_id,
                    agent_name=agent.name
                )

        except Exception as e:
            logger.warning(
                "reputation_fetch_failed",
                token_id=agent.token_id,
                agent_name=agent.name,
                error=str(e)
            )
            raise

    async def sync_single_agent(self, token_id: int):
        """Sync reputation for a single agent by token_id"""
        db = SessionLocal()
        try:
            agent = db.query(Agent).filter(Agent.token_id == token_id).first()

            if not agent:
                logger.warning("agent_not_found", token_id=token_id)
                return

            await self._update_agent_reputation(db, agent)
            logger.info("single_agent_reputation_synced", token_id=token_id)

        except Exception as e:
            logger.error("single_agent_reputation_sync_failed", token_id=token_id, error=str(e))
            raise
        finally:
            db.close()


# Global instance
reputation_sync_service = ReputationSyncService()
