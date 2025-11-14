"""Blockchain synchronization service"""

import asyncio
import httpx
from datetime import datetime
from typing import Optional
from web3 import Web3
from sqlalchemy.orm import Session

from src.core.blockchain_config import (
    SEPOLIA_RPC_URL,
    REGISTRY_CONTRACT_ADDRESS,
    REGISTRY_ABI,
    START_BLOCK,
    BLOCKS_PER_BATCH,
    MAX_RETRIES,
    RETRY_DELAY_SECONDS,
    IPFS_GATEWAY,
)
from src.models import Agent, BlockchainSync, SyncStatusEnum, SyncStatus, AgentStatus, Activity, ActivityType
from src.db.database import SessionLocal
from src.services.ai_classifier import ai_classifier_service
import structlog

logger = structlog.get_logger()


class BlockchainSyncService:
    """Service for synchronizing blockchain data"""

    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
        self.contract = self.w3.eth.contract(
            address=REGISTRY_CONTRACT_ADDRESS,
            abi=REGISTRY_ABI
        )

    async def sync(self):
        """Main sync method"""
        db = SessionLocal()
        try:
            # Get or create sync tracker
            sync_tracker = self._get_sync_tracker(db)

            # Update status to running
            sync_tracker.status = SyncStatusEnum.RUNNING
            db.commit()

            # Get current block number
            current_block = self.w3.eth.block_number
            sync_tracker.current_block = current_block

            # Process blocks in batches
            from_block = sync_tracker.last_block + 1
            to_block = min(from_block + BLOCKS_PER_BATCH, current_block)

            logger.info(
                "sync_started",
                from_block=from_block,
                to_block=to_block,
                current_block=current_block
            )

            # Get events
            await self._process_events(db, from_block, to_block)

            # Update sync tracker
            sync_tracker.last_block = to_block
            sync_tracker.last_synced_at = datetime.utcnow()
            sync_tracker.status = SyncStatusEnum.IDLE
            sync_tracker.error_message = None
            db.commit()

            logger.info("sync_completed", last_block=to_block)

        except Exception as e:
            logger.error("sync_failed", error=str(e))
            if 'sync_tracker' in locals():
                sync_tracker.status = SyncStatusEnum.ERROR
                sync_tracker.error_message = str(e)[:500]
                db.commit()
        finally:
            db.close()

    async def _process_events(self, db: Session, from_block: int, to_block: int):
        """Process blockchain events"""

        # Get Registered events
        registered_events = self.contract.events.Registered.get_logs(
            from_block=from_block,
            to_block=to_block
        )

        logger.info("events_found", event_type="Registered", count=len(registered_events))

        for event in registered_events:
            await self._process_registered_event(db, event)

        # Get UriUpdated events
        updated_events = self.contract.events.UriUpdated.get_logs(
            from_block=from_block,
            to_block=to_block
        )

        logger.info("events_found", event_type="UriUpdated", count=len(updated_events))

        for event in updated_events:
            await self._process_updated_event(db, event)

    async def _process_registered_event(self, db: Session, event):
        """Process Registered event"""
        from sqlalchemy.exc import IntegrityError

        token_id = event['args']['agentId']
        owner = event['args']['owner']
        metadata_uri = event['args']['tokenURI']

        # Get block timestamp for accurate registration time
        block = self.w3.eth.get_block(event['blockNumber'])
        block_timestamp = datetime.fromtimestamp(block['timestamp'])

        logger.info("processing_agent", agent_id=token_id, owner=owner, block_timestamp=block_timestamp)

        # Check if agent already exists
        existing_agent = db.query(Agent).filter(Agent.token_id == token_id).first()

        if existing_agent:
            logger.info("agent_already_exists", token_id=token_id)
            return

        # Fetch metadata
        metadata = await self._fetch_metadata(metadata_uri)

        try:
            # Double-check before insert (in case of concurrent sync)
            existing_agent = db.query(Agent).filter(Agent.token_id == token_id).first()
            if existing_agent:
                logger.info("agent_already_exists_recheck", token_id=token_id)
                return

            # 提取或分类 OASF skills 和 domains
            name = metadata.get('name', f'Agent #{token_id}')
            description = metadata.get('description', 'No description')
            oasf_data = await self._extract_oasf_data(metadata, name, description)

            # Create agent with blockchain timestamp
            agent = Agent(
                token_id=token_id,
                name=name,
                address=owner.lower(),
                owner_address=owner.lower(),
                description=description,
                reputation_score=0.0,  # Will be updated by reputation sync service
                status=AgentStatus.ACTIVE,
                network_id=self._get_default_network_id(db),
                metadata_uri=metadata_uri,
                on_chain_data=dict(event['args']),
                sync_status=SyncStatus.SYNCED,
                last_synced_at=datetime.utcnow(),
                created_at=block_timestamp,  # Use blockchain timestamp
                skills=oasf_data.get('skills'),
                domains=oasf_data.get('domains'),
                classification_source=oasf_data.get('source')
            )

            db.add(agent)
            db.commit()

            # Create activity record with blockchain timestamp
            activity = Activity(
                agent_id=agent.id,
                activity_type=ActivityType.REGISTERED,
                description=f"Agent '{agent.name}' (#{token_id}) registered on-chain",
                tx_hash=event['transactionHash'].hex() if 'transactionHash' in event else None,
                created_at=block_timestamp  # Use blockchain timestamp
            )
            db.add(activity)
            db.commit()

            logger.info("agent_created", token_id=token_id, name=agent.name, registered_at=block_timestamp)

        except IntegrityError as e:
            # Handle concurrent insert from another sync task
            db.rollback()
            logger.warning(
                "agent_insert_conflict",
                token_id=token_id,
                error="Concurrent insert detected, skipping"
            )

    async def _process_updated_event(self, db: Session, event):
        """Process UriUpdated event"""
        token_id = event['args']['agentId']
        metadata_uri = event['args']['newUri']

        agent = db.query(Agent).filter(Agent.token_id == token_id).first()

        if not agent:
            logger.warning("agent_not_found", token_id=token_id)
            return

        # Fetch updated metadata
        metadata = await self._fetch_metadata(metadata_uri)

        # Update agent (reputation_score is managed by reputation sync service)
        name = metadata.get('name', agent.name)
        description = metadata.get('description', agent.description)
        oasf_data = await self._extract_oasf_data(metadata, name, description)

        agent.name = name
        agent.description = description
        agent.metadata_uri = metadata_uri
        agent.last_synced_at = datetime.utcnow()
        agent.sync_status = SyncStatus.SYNCED
        agent.skills = oasf_data.get('skills')
        agent.domains = oasf_data.get('domains')
        agent.classification_source = oasf_data.get('source')

        db.commit()

        logger.info("agent_updated", token_id=token_id)

    async def _fetch_metadata(self, uri: str, retries: int = MAX_RETRIES) -> dict:
        """Fetch metadata from URI with retry logic"""
        import base64
        import json

        # Handle empty URI
        if not uri or uri.strip() == '':
            logger.debug("empty_metadata_uri")
            return {
                'name': 'Unknown Agent',
                'description': 'No metadata URI provided'
            }

        # Handle direct JSON string (some contracts store JSON directly)
        if uri.startswith('{'):
            try:
                metadata = json.loads(uri)
                logger.info("direct_json_parsed", agent_id=metadata.get('agent_id', 'Unknown'))
                # Map agent_id to name if name not present
                if 'name' not in metadata and 'agent_id' in metadata:
                    metadata['name'] = metadata['agent_id']
                if 'description' not in metadata:
                    metadata['description'] = 'Agent from direct JSON'
                return metadata
            except Exception as e:
                logger.warning("direct_json_parse_failed", error=str(e), uri=uri[:100])

        # Handle data URI (data:application/json;base64,... or data:application/json,{...})
        if uri.startswith('data:'):
            try:
                # Handle base64 encoded data URI
                if 'base64,' in uri:
                    base64_data = uri.split('base64,')[1]
                    json_data = base64.b64decode(base64_data).decode('utf-8')
                    metadata = json.loads(json_data)
                    logger.info("data_uri_parsed", format="base64", name=metadata.get('name', 'Unknown'))
                    return metadata
                # Handle plain JSON data URI (data:application/json,{...})
                elif ',' in uri:
                    json_data = uri.split(',', 1)[1]  # Split only on first comma
                    # URL decode if needed
                    from urllib.parse import unquote
                    json_data = unquote(json_data)
                    metadata = json.loads(json_data)
                    logger.info("data_uri_parsed", format="plain", name=metadata.get('name', 'Unknown'))
                    return metadata
                else:
                    logger.warning("unsupported_data_uri_format", uri=uri[:100])
            except Exception as e:
                logger.warning("data_uri_parse_failed", error=str(e), uri=uri[:100])
                return {
                    'name': 'Unknown Agent',
                    'description': 'Data URI parse failed'
                }

        # Handle IPFS URI
        if uri.startswith('ipfs://'):
            url = f"{IPFS_GATEWAY}{uri[7:]}"
        else:
            url = uri

        # Fetch from HTTP/HTTPS URL
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    return response.json()
            except Exception as e:
                logger.warning(
                    "metadata_fetch_failed",
                    url=url,
                    attempt=attempt + 1,
                    error=str(e)
                )
                if attempt < retries - 1:
                    await asyncio.sleep(RETRY_DELAY_SECONDS)

        # Return default metadata if all retries failed
        return {
            'name': 'Unknown Agent',
            'description': 'Metadata fetch failed'
        }

    def _is_valid_description(self, description: str) -> bool:
        """检查 description 是否足够有效以进行 AI 分类

        返回 True 如果 description 有效，否则返回 False

        规则:
        1. description 不能为空
        2. 长度至少 20 个字符（基础要求）
        3. 不能是常见的错误信息或默认值
        4. 不能是测试数据或明显的时间戳

        注: 语义是否充分由 LLM 判断，LLM 会在语义不足时返回空数组
        """
        if not description or not isinstance(description, str):
            return False

        # 去除首尾空格
        description = description.strip()

        # 检查最小长度（20 个字符，过滤极短描述）
        MIN_DESCRIPTION_LENGTH = 20
        if len(description) < MIN_DESCRIPTION_LENGTH:
            return False

        # 常见的无效描述模式（小写比较）
        invalid_patterns = [
            'no metadata',
            'metadata fetch failed',
            'no description',
            'unknown agent',
            'agent from direct json',
            'no metadata uri provided',
            'failed to fetch',
            'error fetching',
            'not available',
            'n/a',
            'test agent',  # 测试数据
            'created at',  # 时间戳标记
            'updated',     # 更新标记
            'lorem ipsum', # 占位符文本
            'todo',
            'placeholder',
            'example',
            'demo agent',
        ]

        description_lower = description.lower()
        for pattern in invalid_patterns:
            if pattern in description_lower:
                return False

        # 检查是否主要由数字组成（如纯时间戳）
        # 如果数字字符超过 50%，很可能是无效描述
        digit_count = sum(c.isdigit() for c in description)
        if digit_count / len(description) > 0.5:
            return False

        return True

    async def _extract_oasf_data(self, metadata: dict, name: str, description: str) -> dict:
        """提取或自动分类 OASF skills 和 domains

        优先级：
        1. 如果 metadata 中有 endpoints[].skills/domains (OASF 格式)，直接使用
        2. 否则使用 AI 分类服务自动分析 description
        """
        skills = []
        domains = []

        # 尝试从 metadata 的 endpoints 中提取 OASF 信息
        if 'endpoints' in metadata and isinstance(metadata['endpoints'], list):
            for endpoint in metadata['endpoints']:
                if isinstance(endpoint, dict):
                    # 提取 skills
                    if 'skills' in endpoint and isinstance(endpoint['skills'], list):
                        skills.extend(endpoint['skills'])
                    # 提取 domains
                    if 'domains' in endpoint and isinstance(endpoint['domains'], list):
                        domains.extend(endpoint['domains'])

        # 如果从 metadata 中提取到了 skills/domains，直接使用
        if skills or domains:
            logger.info(
                "oasf_extracted_from_metadata",
                name=name,
                skills_count=len(skills),
                domains_count=len(domains)
            )
            return {
                "skills": list(set(skills))[:5],  # 去重并限制数量
                "domains": list(set(domains))[:3],
                "source": "metadata"  # 标记来源为 metadata（agent 自带）
            }

        # 否则使用 AI 分类（但需要有足够的描述信息）
        # 检查 description 是否有效且足够详细
        if not self._is_valid_description(description):
            logger.info(
                "oasf_classification_skipped",
                name=name,
                reason="insufficient_description",
                description_preview=description[:50] if description else None
            )
            return {"skills": [], "domains": [], "source": None}

        try:
            classification = await ai_classifier_service.classify_agent(name, description)
            logger.info(
                "oasf_auto_classified",
                name=name,
                skills_count=len(classification.get('skills', [])),
                domains_count=len(classification.get('domains', []))
            )
            # 添加 source 标记
            classification["source"] = "ai"
            return classification
        except Exception as e:
            logger.warning("oasf_classification_failed", name=name, error=str(e))
            return {"skills": [], "domains": [], "source": None}

    def _get_sync_tracker(self, db: Session) -> BlockchainSync:
        """Get or create blockchain sync tracker"""
        sync = db.query(BlockchainSync).filter(
            BlockchainSync.network_name == "sepolia"
        ).first()

        if not sync:
            sync = BlockchainSync(
                network_name="sepolia",
                contract_address=REGISTRY_CONTRACT_ADDRESS,
                last_block=START_BLOCK - 1,  # Start from configured block
                status=SyncStatusEnum.IDLE
            )
            db.add(sync)
            db.commit()

        return sync

    def _get_default_network_id(self, db: Session) -> str:
        """Get default network ID (Sepolia)"""
        from src.models import Network
        network = db.query(Network).filter(
            Network.name == "Sepolia"
        ).first()

        if network:
            return network.id

        # Create if not exists
        network = Network(
            name="Sepolia",
            chain_id=11155111,
            rpc_url=SEPOLIA_RPC_URL,
            explorer_url="https://sepolia.etherscan.io"
        )
        db.add(network)
        db.commit()
        return network.id


# Global instance
blockchain_sync_service = BlockchainSyncService()
