"""Read-only routes for the OASF taxonomy."""

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models.agent import Agent
from src.services.public_snapshot import PublicSnapshot
from src.taxonomies.oasf_taxonomy import (
    get_all_skills,
    get_all_domains,
    get_skill_display_name,
    get_domain_display_name,
)

router = APIRouter()


@router.get("/taxonomy/distribution")
async def get_taxonomy_distribution(db: Session = Depends(get_db)):
    return await distribution_snapshot.get(db)


def _build_taxonomy_distribution(db: Session):
    """获取分类分布统计，用于首页展示热门分类

    返回 Skills 和 Domains 的分布情况，聚合到一级分类
    """
    rows = db.query(Agent.skills, Agent.domains).filter(
        Agent.skills.is_not(None), Agent.skills != "[]"
    ).yield_per(1000)

    total_classified = 0
    skill_counts = Counter()
    domain_counts = Counter()
    for skills, domains in rows:
        total_classified += 1
        # Each agent counts once per category. Preserve first-seen order for ties.
        skill_counts.update(dict.fromkeys(map(_get_skill_category, skills or []), 1))
        domain_counts.update(dict.fromkeys(map(_get_domain_category, domains or []), 1))

    total_agents = db.query(Agent).count()

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


distribution_snapshot = PublicSnapshot("taxonomy_distribution", 1800, _build_taxonomy_distribution)


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
