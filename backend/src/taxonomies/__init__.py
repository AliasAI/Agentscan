"""OASF Taxonomy 模块"""

from .oasf_taxonomy import (
    get_all_skills,
    get_all_domains,
    get_skill_display_name,
    get_domain_display_name,
    get_skill_category,
    get_domain_category,
    OASF_SKILLS,
    OASF_DOMAINS,
)

__all__ = [
    "get_all_skills",
    "get_all_domains",
    "get_skill_display_name",
    "get_domain_display_name",
    "get_skill_category",
    "get_domain_category",
    "OASF_SKILLS",
    "OASF_DOMAINS",
]
