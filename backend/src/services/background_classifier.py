"""后台异步分类服务

支持异步批量分类 agents，不阻塞主服务
"""

import asyncio
from datetime import datetime
from typing import Optional
import structlog

from src.db.database import SessionLocal
from src.models.agent import Agent
from src.services.ai_classifier import ai_classifier_service

logger = structlog.get_logger(__name__)


class BackgroundClassificationTask:
    """后台分类任务"""

    def __init__(self):
        self.is_running = False
        self.total_agents = 0
        self.processed = 0
        self.classified = 0
        self.failed = 0
        self.started_at: Optional[datetime] = None
        self.finished_at: Optional[datetime] = None
        self.current_agent_name: Optional[str] = None
        self.error_message: Optional[str] = None

    def get_status(self) -> dict:
        """获取任务状态"""
        return {
            "is_running": self.is_running,
            "total_agents": self.total_agents,
            "processed": self.processed,
            "classified": self.classified,
            "failed": self.failed,
            "progress": round(self.processed / self.total_agents * 100, 2) if self.total_agents > 0 else 0,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "current_agent": self.current_agent_name,
            "error": self.error_message,
        }

    async def run(self, limit: Optional[int] = None, batch_size: int = 10):
        """执行分类任务

        Args:
            limit: 最多处理多少个 agent（None 表示全部）
            batch_size: 每批处理多少个（避免一次性占用太多资源）
        """
        if self.is_running:
            logger.warning("classification_task_already_running")
            return

        self.is_running = True
        self.started_at = datetime.now()
        self.finished_at = None
        self.processed = 0
        self.classified = 0
        self.failed = 0
        self.error_message = None

        try:
            with SessionLocal() as db:
                # 获取未分类的 agents 总数
                query = db.query(Agent).filter(
                    (Agent.skills == None) | (Agent.skills == "[]")
                )

                self.total_agents = query.count()

                if limit:
                    self.total_agents = min(self.total_agents, limit)

                logger.info(
                    "background_classification_started",
                    total=self.total_agents,
                    limit=limit,
                    batch_size=batch_size
                )

                # 分批处理
                offset = 0
                while offset < self.total_agents:
                    # 获取一批 agents
                    batch = (
                        query
                        .offset(offset)
                        .limit(batch_size)
                        .all()
                    )

                    if not batch:
                        break

                    # 处理这批 agents
                    for agent in batch:
                        if not self.is_running:
                            logger.info("classification_task_cancelled")
                            return

                        self.current_agent_name = agent.name

                        try:
                            # 调用 AI 分类
                            classification = await ai_classifier_service.classify_agent(
                                agent.name,
                                agent.description
                            )

                            # 更新数据库
                            agent.skills = classification.get("skills", [])
                            agent.domains = classification.get("domains", [])
                            db.commit()

                            self.classified += 1
                            self.processed += 1

                            logger.info(
                                "agent_classified",
                                agent_id=agent.id,
                                agent_name=agent.name,
                                skills_count=len(agent.skills or []),
                                domains_count=len(agent.domains or []),
                                progress=f"{self.processed}/{self.total_agents}"
                            )

                        except Exception as e:
                            self.failed += 1
                            self.processed += 1
                            logger.error(
                                "agent_classification_failed",
                                agent_id=agent.id,
                                agent_name=agent.name,
                                error=str(e)
                            )

                        # 让出控制权，避免阻塞
                        await asyncio.sleep(0.1)

                    offset += batch_size

                    # 批次间休息，避免 API 限流
                    if offset < self.total_agents:
                        await asyncio.sleep(1)

        except Exception as e:
            self.error_message = str(e)
            logger.error("background_classification_error", error=str(e))

        finally:
            self.is_running = False
            self.finished_at = datetime.now()
            self.current_agent_name = None

            duration = (self.finished_at - self.started_at).total_seconds()

            logger.info(
                "background_classification_finished",
                total=self.total_agents,
                classified=self.classified,
                failed=self.failed,
                duration_seconds=duration
            )

    def cancel(self):
        """取消任务"""
        if self.is_running:
            logger.info("cancelling_classification_task")
            self.is_running = False


# 全局单例
background_classification_task = BackgroundClassificationTask()
