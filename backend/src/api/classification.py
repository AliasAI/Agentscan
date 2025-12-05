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


@router.get("/taxonomy/distribution")
async def get_taxonomy_distribution(db: Session = Depends(get_db)):
    """获取分类分布统计，用于首页展示热门分类

    返回 Skills 和 Domains 的分布情况，聚合到一级分类
    """
    from collections import defaultdict

    # 获取所有有分类的 agents
    agents = db.query(Agent).filter(
        (Agent.skills != None) & (Agent.skills != "[]")
    ).all()

    total_agents = db.query(Agent).count()
    total_classified = len(agents)

    # 统计 skills 分布（聚合到一级分类，每个 agent 只计入一次）
    skill_agent_sets = defaultdict(set)  # 用 set 存 agent_id，确保去重
    for agent in agents:
        if agent.skills:
            for skill in agent.skills:
                # 提取一级分类（如 "nlp/text_generation" -> "NLP"）
                category = _get_skill_category(skill)
                skill_agent_sets[category].add(agent.id)
    skill_counts = {cat: len(ids) for cat, ids in skill_agent_sets.items()}

    # 统计 domains 分布（聚合到一级分类，每个 agent 只计入一次）
    domain_agent_sets = defaultdict(set)  # 用 set 存 agent_id，确保去重
    for agent in agents:
        if agent.domains:
            for domain in agent.domains:
                # 提取一级分类（如 "finance/trading" -> "Finance"）
                category = _get_domain_category(domain)
                domain_agent_sets[category].add(agent.id)
    domain_counts = {cat: len(ids) for cat, ids in domain_agent_sets.items()}

    # 转换为列表并排序
    skills_total = sum(skill_counts.values()) or 1
    skills_list = [
        {
            "category": cat,
            "slug": cat.lower().replace(" ", "_"),
            "count": count,
            "percentage": round(count / skills_total * 100, 1)
        }
        for cat, count in skill_counts.items()
    ]
    skills_list.sort(key=lambda x: x["count"], reverse=True)

    domains_total = sum(domain_counts.values()) or 1
    domains_list = [
        {
            "category": cat,
            "slug": cat.lower().replace(" ", "_"),
            "count": count,
            "percentage": round(count / domains_total * 100, 1)
        }
        for cat, count in domain_counts.items()
    ]
    domains_list.sort(key=lambda x: x["count"], reverse=True)

    # 只返回 Top 4，其余聚合为 Others
    def aggregate_others(items, top_n=4):
        if len(items) <= top_n:
            return items

        top_items = items[:top_n]
        others_count = sum(item["count"] for item in items[top_n:])
        others_percentage = sum(item["percentage"] for item in items[top_n:])

        if others_count > 0:
            top_items.append({
                "category": "Others",
                "slug": "others",
                "count": others_count,
                "percentage": round(others_percentage, 1)
            })

        return top_items

    return {
        "skills": aggregate_others(skills_list),
        "domains": aggregate_others(domains_list),
        "total_classified": total_classified,
        "total_agents": total_agents,
    }


def _get_skill_category(skill_slug: str) -> str:
    """从 skill slug 提取一级分类名称"""
    # skill slug 格式: "category/subcategory" 或 "category"
    category_map = {
        "nlp": "NLP",
        "vision": "Vision",
        "analytical": "Analytics",
        "multi_modal": "Multi-modal",
        "rag": "RAG",
        "agent": "Agent",
        "data": "Data",
        "devops": "DevOps",
        "evaluation": "Evaluation",
        "reasoning": "Reasoning",
        "governance": "Governance",
        "security": "Security",
        "tool": "Tools",
        "audio": "Audio",
        "tabular": "Tabular",
    }

    # 尝试匹配前缀
    skill_lower = skill_slug.lower()
    for prefix, name in category_map.items():
        if skill_lower.startswith(prefix):
            return name

    # 默认返回首字母大写
    parts = skill_slug.split("/")
    return parts[0].replace("_", " ").title()


def _get_domain_category(domain_slug: str) -> str:
    """从 domain slug 提取一级分类名称"""
    # domain slug 格式: "category/subcategory" 或 "category"
    category_map = {
        "technology": "Technology",
        "finance": "Finance",
        "gaming": "Gaming",
        "healthcare": "Healthcare",
        "education": "Education",
        "media": "Media",
        "retail": "Retail",
        "legal": "Legal",
        "real_estate": "Real Estate",
        "energy": "Energy",
        "agriculture": "Agriculture",
        "transportation": "Transport",
        "hospitality": "Hospitality",
        "insurance": "Insurance",
        "government": "Government",
        "social": "Social",
        "sports": "Sports",
        "life_science": "Life Science",
        "industrial": "Industrial",
        "hr": "HR",
        "marketing": "Marketing",
        "telecom": "Telecom",
        "research": "Research",
        "trust": "Trust",
        "environmental": "Environment",
    }

    # 尝试匹配前缀
    domain_lower = domain_slug.lower()
    for prefix, name in category_map.items():
        if domain_lower.startswith(prefix):
            return name

    # 默认返回首字母大写
    parts = domain_slug.split("/")
    return parts[0].replace("_", " ").title()


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
