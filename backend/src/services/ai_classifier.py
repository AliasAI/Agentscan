"""AI 分类服务

使用 LLM 自动分析 agent description 并分类到 OASF taxonomy
"""

import os
import json
from typing import Dict, List
import structlog
import httpx

from src.taxonomies.oasf_taxonomy import OASF_SKILLS, OASF_DOMAINS

logger = structlog.get_logger(__name__)


class AIClassifierService:
    """使用 AI 自动分类 agent skills 和 domains"""

    def __init__(self):
        """初始化分类器"""
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.api_url = "https://api.anthropic.com/v1/messages"

        # 如果没有 API key，降级到基于关键词的简单分类
        self.use_fallback = not self.api_key
        if self.use_fallback:
            logger.warning("anthropic_api_key_not_found", message="将使用基于关键词的简单分类")

    async def classify_agent(self, name: str, description: str) -> Dict[str, List[str]]:
        """分析 agent 并返回分类结果

        Args:
            name: Agent 名称
            description: Agent 描述

        Returns:
            {"skills": [...], "domains": [...]}
        """
        if not description or description.strip() == "":
            logger.debug("empty_description", name=name)
            return {"skills": [], "domains": []}

        # 如果没有 API key，使用简单的关键词匹配
        if self.use_fallback:
            return self._fallback_classify(name, description)

        try:
            return await self._llm_classify(name, description)
        except Exception as e:
            logger.warning("llm_classification_failed", error=str(e), name=name)
            # 降级到关键词分类
            return self._fallback_classify(name, description)

    async def _llm_classify(self, name: str, description: str) -> Dict[str, List[str]]:
        """使用 Claude API 进行分类"""

        prompt = f"""分析以下 AI Agent，并从提供的 OASF 分类体系中选择最合适的 skills 和 domains。

Agent 名称: {name}
Agent 描述: {description}

可用的 Skills:
{json.dumps(OASF_SKILLS, indent=2)}

可用的 Domains:
{json.dumps(OASF_DOMAINS, indent=2)}

请仔细分析 agent 的描述，选择最多 5 个最相关的 skills 和最多 3 个最相关的 domains。

返回格式（只返回 JSON，不要其他内容）:
{{
  "skills": ["skill1", "skill2", ...],
  "domains": ["domain1", "domain2", ...]
}}"""

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                self.api_url,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 1024,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )

            response.raise_for_status()
            result = response.json()

            # 提取 JSON 响应
            content = result["content"][0]["text"]

            # 尝试解析 JSON
            try:
                classification = json.loads(content)
            except json.JSONDecodeError:
                # 如果返回的不是纯 JSON，尝试提取 JSON 部分
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    classification = json.loads(json_match.group())
                else:
                    raise ValueError("无法从 LLM 响应中提取 JSON")

            # 验证结果
            skills = [s for s in classification.get("skills", []) if s in OASF_SKILLS]
            domains = [d for d in classification.get("domains", []) if d in OASF_DOMAINS]

            logger.info(
                "llm_classification_success",
                name=name,
                skills_count=len(skills),
                domains_count=len(domains)
            )

            return {
                "skills": skills[:5],  # 最多 5 个
                "domains": domains[:3]  # 最多 3 个
            }

    def _fallback_classify(self, name: str, description: str) -> Dict[str, List[str]]:
        """基于关键词的简单分类（降级方案）"""

        text = f"{name} {description}".lower()
        matched_skills = []
        matched_domains = []

        # Skill 关键词映射（使用真实的 OASF slugs）
        skill_keywords = {
            # Code & Programming
            "analytical_skills/coding_skills/text_to_code": ["code generation", "generate code", "write code", "programming"],
            "analytical_skills/coding_skills/code_optimization": ["optimize", "performance", "refactor"],
            "analytical_skills/coding_skills/code_to_docstrings": ["documentation", "docstring", "comment"],

            # NLP
            "natural_language_processing/text_generation": ["text generation", "writing", "content creation", "generate text"],
            "natural_language_processing/summarization": ["summary", "summarize", "abstract"],
            "natural_language_processing/translation": ["translate", "translation", "multilingual"],
            "natural_language_processing/sentiment_analysis": ["sentiment", "emotion", "feeling"],

            # Data
            "data_engineering/data_transformation_pipeline": ["data pipeline", "etl", "data processing"],
            "data_engineering/data_cleaning": ["data cleaning", "clean data", "data quality"],
            "data_engineering/feature_engineering": ["feature", "feature engineering"],

            # Blockchain
            "blockchain/smart_contract_development": ["smart contract", "solidity", "ethereum", "web3"],
            "blockchain/blockchain_analytics": ["blockchain analytics", "on-chain", "crypto"],

            # Images
            "images_computer_vision/image_classification": ["image classification", "classify image"],
            "images_computer_vision/object_detection": ["object detection", "detect", "recognition"],
            "images_computer_vision/image_generation": ["image generation", "generate image", "art", "picture"],

            # Agent
            "agent_orchestration/task_decomposition": ["task decomposition", "break down", "subtask"],
            "agent_orchestration/multi_agent_planning": ["multi-agent", "coordination", "collaborate"],

            # Planning
            "advanced_reasoning_planning/strategic_planning": ["strategy", "strategic", "planning"],
            "advanced_reasoning_planning/chain_of_thought_structuring": ["reasoning", "think", "logic"],

            # Retrieval
            "retrieval_augmented_generation/document_retrieval": ["search", "retrieve", "find", "lookup", "rag"],
            "retrieval_augmented_generation/semantic_search": ["semantic search", "similarity"],

            # Security
            "security_privacy/threat_detection": ["security", "threat", "vulnerability", "detect"],
        }

        # Domain 关键词映射（使用真实的 OASF slugs）
        domain_keywords = {
            # Technology
            "technology/software_engineering": ["software", "engineering", "development"],
            "technology/software_engineering/devops": ["devops", "ci/cd", "deployment"],
            "technology/artificial_intelligence": ["ai", "artificial intelligence", "machine learning", "ml"],
            "technology/data_science": ["data science", "analytics", "data analysis"],
            "technology/blockchain": ["blockchain", "crypto", "web3", "defi", "nft"],
            "technology/cybersecurity": ["security", "cybersecurity", "threat"],

            # Finance
            "finance_and_business/finance": ["finance", "financial", "money"],
            "finance_and_business/banking": ["bank", "banking", "payment"],
            "finance_and_business/trading": ["trading", "trade", "market", "exchange"],
            "finance_and_business/investment": ["investment", "invest", "portfolio"],
            "finance_and_business/accounting": ["accounting", "bookkeeping", "ledger"],

            # Healthcare
            "healthcare/medical_services": ["medical", "health", "healthcare", "doctor"],
            "healthcare/telemedicine": ["telemedicine", "remote health"],

            # Education
            "education/e_learning": ["education", "learning", "teach", "course"],
            "education/educational_technology": ["edtech", "educational technology"],

            # Media
            "media_and_entertainment/content_creation": ["content", "media", "creator"],
            "media_and_entertainment/social_media": ["social media", "twitter", "instagram", "tiktok"],

            # Legal
            "legal/contract_management": ["contract", "legal", "agreement"],

            # Marketing
            "telecommunications/marketing_automation": ["marketing", "campaign", "promotion"],

            # Productivity
            "technology/productivity_tools": ["productivity", "task", "todo", "organize"],

            # Agriculture
            "agriculture/precision_agriculture": ["agriculture", "farming", "crop"],

            # Transportation
            "transportation/logistics": ["logistics", "supply chain", "delivery"],

            # Real Estate
            "real_estate/property_management": ["real estate", "property", "housing"],
        }

        # 匹配 skills
        for skill, keywords in skill_keywords.items():
            if skill in OASF_SKILLS:  # 确保是有效的 skill
                if any(keyword in text for keyword in keywords):
                    if skill not in matched_skills:
                        matched_skills.append(skill)

        # 匹配 domains
        for domain, keywords in domain_keywords.items():
            if domain in OASF_DOMAINS:  # 确保是有效的 domain
                if any(keyword in text for keyword in keywords):
                    if domain not in matched_domains:
                        matched_domains.append(domain)

        logger.info(
            "fallback_classification",
            name=name,
            skills_count=len(matched_skills),
            domains_count=len(matched_domains)
        )

        return {
            "skills": matched_skills[:5],
            "domains": matched_domains[:3]
        }


# 全局实例
ai_classifier_service = AIClassifierService()
