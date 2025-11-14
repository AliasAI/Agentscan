"""Classification API - OASF skills 和 domains 自动分类"""

import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models.agent import Agent
from src.services.ai_classifier import ai_classifier_service
from src.services.background_classifier import background_classification_task
from src.taxonomies.oasf_taxonomy import (
    get_all_skills,
    get_all_domains,
    get_skill_display_name,
    get_domain_display_name,
)
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/agents/{agent_id}/classify")
async def classify_agent(
    agent_id: str,
    db: Session = Depends(get_db),
):
    """手动触发对指定 agent 的分类

    使用 AI 分析 agent 的 description 并自动打上 OASF skills 和 domains 标签
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    try:
        # 调用 AI 分类服务
        classification = await ai_classifier_service.classify_agent(
            agent.name,
            agent.description
        )

        # 更新 agent
        agent.skills = classification.get("skills", [])
        agent.domains = classification.get("domains", [])
        agent.classification_source = "ai"  # 手动触发的分类也是 AI 分类
        db.commit()

        logger.info(
            "agent_reclassified",
            agent_id=agent_id,
            skills_count=len(agent.skills or []),
            domains_count=len(agent.domains or [])
        )

        return {
            "agent_id": agent_id,
            "skills": agent.skills,
            "domains": agent.domains,
        }

    except Exception as e:
        logger.error("classification_failed", agent_id=agent_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.post("/agents/classify-all")
async def classify_all_agents(
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """批量为所有 agent 进行分类

    参数:
        limit: 最多处理多少个 agent（默认 100）
    """
    # 获取还没有分类的 agents（skills 为 NULL 或空）
    agents = (
        db.query(Agent)
        .filter((Agent.skills == None) | (Agent.skills == "[]"))
        .limit(limit)
        .all()
    )

    classified_count = 0
    failed_count = 0

    for agent in agents:
        try:
            classification = await ai_classifier_service.classify_agent(
                agent.name,
                agent.description
            )

            agent.skills = classification.get("skills", [])
            agent.domains = classification.get("domains", [])
            agent.classification_source = "ai"  # 批量分类也是 AI 分类
            db.commit()

            classified_count += 1

            logger.info(
                "agent_classified",
                agent_id=agent.id,
                skills_count=len(agent.skills or []),
                domains_count=len(agent.domains or [])
            )

        except Exception as e:
            logger.error("classification_failed", agent_id=agent.id, error=str(e))
            failed_count += 1

    return {
        "total_processed": classified_count + failed_count,
        "classified": classified_count,
        "failed": failed_count,
    }


@router.get("/taxonomy/skills")
async def get_skills():
    """获取所有可用的 OASF skills"""
    skills = get_all_skills()
    return {
        "count": len(skills),
        "skills": [
            {
                "slug": skill,
                "display_name": get_skill_display_name(skill)
            }
            for skill in skills
        ]
    }


@router.get("/taxonomy/domains")
async def get_domains():
    """获取所有可用的 OASF domains"""
    domains = get_all_domains()
    return {
        "count": len(domains),
        "domains": [
            {
                "slug": domain,
                "display_name": get_domain_display_name(domain)
            }
            for domain in domains
        ]
    }


# ==================== 后台异步分类 API ====================


@router.post("/agents/classify-background")
async def start_background_classification(
    background_tasks: BackgroundTasks,
    limit: Optional[int] = None,
    batch_size: int = 10,
):
    """启动后台异步分类任务

    Args:
        limit: 最多处理多少个 agent（None 表示全部，建议先从小数量开始测试）
        batch_size: 每批处理多少个（默认 10，避免一次性占用太多资源）

    示例:
        POST /api/agents/classify-background?limit=100&batch_size=10
    """
    if background_classification_task.is_running:
        return {
            "status": "already_running",
            "message": "后台分类任务已在运行中",
            "task_status": background_classification_task.get_status()
        }

    # 使用 FastAPI 的 BackgroundTasks 启动异步任务
    background_tasks.add_task(
        background_classification_task.run,
        limit=limit,
        batch_size=batch_size
    )

    logger.info(
        "background_classification_task_started",
        limit=limit,
        batch_size=batch_size
    )

    return {
        "status": "started",
        "message": f"后台分类任务已启动，将处理最多 {limit or '全部'} 个 agents",
        "limit": limit,
        "batch_size": batch_size,
        "task_status": background_classification_task.get_status()
    }


@router.get("/agents/classify-background/status")
async def get_background_classification_status():
    """获取后台分类任务状态"""
    return background_classification_task.get_status()


@router.post("/agents/classify-background/cancel")
async def cancel_background_classification():
    """取消后台分类任务"""
    if not background_classification_task.is_running:
        return {
            "status": "not_running",
            "message": "没有正在运行的分类任务"
        }

    background_classification_task.cancel()

    return {
        "status": "cancelled",
        "message": "已发送取消信号，任务将在当前 agent 处理完成后停止",
        "task_status": background_classification_task.get_status()
    }
