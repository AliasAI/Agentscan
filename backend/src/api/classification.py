"""Classification API - OASF skills 和 domains 自动分类"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models.agent import Agent
from src.services.ai_classifier import ai_classifier_service
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
