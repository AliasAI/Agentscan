"""OASF v0.8.0 完整分类体系

基于 agent0_sdk 的 OASF 规范，提供完整的 136 skills 和 204 domains 分类。
来源：https://github.com/agent0lab/agent0-py
"""

import json
import os
from typing import List

# 加载完整的 OASF taxonomy
_TAXONOMY_DIR = os.path.dirname(__file__)
_SKILLS_FILE = os.path.join(_TAXONOMY_DIR, 'all_skills.json')
_DOMAINS_FILE = os.path.join(_TAXONOMY_DIR, 'all_domains.json')

def _load_skills() -> List[str]:
    """从 JSON 文件加载完整的 skills 列表"""
    with open(_SKILLS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return list(data['skills'].keys())

def _load_domains() -> List[str]:
    """从 JSON 文件加载完整的 domains 列表"""
    with open(_DOMAINS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return list(data['domains'].keys())

# 加载完整列表
OASF_SKILLS = _load_skills()
OASF_DOMAINS = _load_domains()


def get_all_skills():
    """获取所有可用的 skills"""
    return OASF_SKILLS


def get_all_domains():
    """获取所有可用的 domains"""
    return OASF_DOMAINS


def get_skill_display_name(skill_slug: str) -> str:
    """将 skill slug 转换为显示名称

    例如: "advanced_reasoning_planning/strategic_planning" -> "Strategic Planning"
    支持多层路径: "a/b/c" -> "C"
    """
    if "/" in skill_slug:
        # 取最后一个部分作为显示名称
        skill = skill_slug.split("/")[-1]
        return skill.replace("_", " ").title()
    return skill_slug.replace("_", " ").title()


def get_domain_display_name(domain_slug: str) -> str:
    """将 domain slug 转换为显示名称

    例如: "finance_and_business/investment_services" -> "Investment Services"
    支持多层路径: "a/b/c" -> "C"
    """
    if "/" in domain_slug:
        # 取最后一个部分作为显示名称
        domain = domain_slug.split("/")[-1]
        return domain.replace("_", " ").title()
    return domain_slug.replace("_", " ").title()


def get_skill_category(skill_slug: str) -> str:
    """获取 skill 的分类

    例如: "advanced_reasoning_planning/strategic_planning" -> "Advanced Reasoning Planning"
    """
    if "/" in skill_slug:
        category = skill_slug.split("/")[0]
        return category.replace("_", " ").title()
    return "Uncategorized"


def get_domain_category(domain_slug: str) -> str:
    """获取 domain 的分类

    例如: "finance_and_business/investment_services" -> "Finance And Business"
    """
    if "/" in domain_slug:
        category = domain_slug.split("/")[0]
        return category.replace("_", " ").title()
    return "Uncategorized"
