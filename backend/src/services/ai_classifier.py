"""AI 分类服务

使用多种 LLM 自动分析 agent description 并分类到 OASF taxonomy

支持的 LLM 提供商:
- DeepSeek (推荐，性价比高)
- OpenAI (GPT-4o-mini)
- OpenRouter (支持多种模型)
- Anthropic Claude (保持向后兼容)
"""

import os
import json
from typing import Dict, List, Optional
import structlog
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量（参考 herAI 的模式）
load_dotenv()

from src.taxonomies.oasf_taxonomy import OASF_SKILLS, OASF_DOMAINS

logger = structlog.get_logger(__name__)


class AIClassifierService:
    """使用 AI 自动分类 agent skills 和 domains"""

    def __init__(self):
        """初始化分类器"""
        # 从环境变量获取配置
        self.llm_provider = os.getenv("LLM_PROVIDER", "deepseek")  # 默认使用 deepseek
        self.model_name = os.getenv("LLM_MODEL_NAME", "")

        # 初始化 LLM 客户端
        self._initialize_llm_client()

    def _initialize_llm_client(self):
        """初始化 LLM 客户端（参考 herAI 的初始化模式）"""
        provider = self.llm_provider.lower()

        try:
            if provider == "deepseek":
                api_key = os.getenv("DEEPSEEK_API_KEY")
                if not api_key:
                    logger.warning("deepseek_api_key_not_found", message="将使用关键词分类")
                    self.use_fallback = True
                    return

                # 使用 OpenAI SDK + DeepSeek API（兼容 OpenAI 接口）
                self.client = OpenAI(
                    api_key=api_key,
                    base_url="https://api.deepseek.com/v1"
                )
                self.model_name = self.model_name or "deepseek-chat"
                self.use_fallback = False

            elif provider == "openai":
                api_key = os.getenv("OPENAI_API_KEY")
                if not api_key:
                    logger.warning("openai_api_key_not_found", message="将使用关键词分类")
                    self.use_fallback = True
                    return

                self.client = OpenAI(api_key=api_key)
                self.model_name = self.model_name or "gpt-4o-mini"
                self.use_fallback = False

            elif provider == "openrouter":
                api_key = os.getenv("OPENROUTER_API_KEY")
                if not api_key:
                    logger.warning("openrouter_api_key_not_found", message="将使用关键词分类")
                    self.use_fallback = True
                    return

                # OpenRouter 提供统一接口访问多种模型
                self.client = OpenAI(
                    api_key=api_key,
                    base_url="https://openrouter.ai/api/v1"
                )
                self.model_name = self.model_name or "deepseek/deepseek-chat"
                self.use_fallback = False

            elif provider == "anthropic":
                # 保留原有的 Anthropic 实现（使用 httpx）
                api_key = os.getenv("ANTHROPIC_API_KEY")
                if not api_key:
                    logger.warning("anthropic_api_key_not_found", message="将使用关键词分类")
                    self.use_fallback = True
                    return

                self.api_key = api_key
                self.api_url = "https://api.anthropic.com/v1/messages"
                self.model_name = self.model_name or "claude-3-haiku-20240307"
                self.client = None  # Anthropic 使用不同的调用方式
                self.use_fallback = False

            else:
                logger.error("unsupported_llm_provider", provider=provider)
                self.use_fallback = True
                return

            if not self.use_fallback:
                logger.info(
                    "llm_client_initialized",
                    provider=self.llm_provider,
                    model=self.model_name
                )

        except Exception as e:
            logger.error("llm_initialization_failed", error=str(e))
            self.use_fallback = True

    def _is_valid_description(self, description: str) -> bool:
        """检查 description 是否足够有效以进行分类

        返回 True 如果 description 有效，否则返回 False

        规则:
        1. description 不能为空
        2. 长度至少 20 个字符
        3. 不能是常见的错误信息或默认值
        """
        if not description or not isinstance(description, str):
            return False

        # 去除首尾空格
        description = description.strip()

        # 检查最小长度（至少 20 个字符，确保有足够的上下文）
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
        ]

        description_lower = description.lower()
        for pattern in invalid_patterns:
            if pattern in description_lower:
                return False

        return True

    async def classify_agent(self, name: str, description: str) -> Dict[str, List[str]]:
        """分析 agent 并返回分类结果

        Args:
            name: Agent 名称
            description: Agent 描述

        Returns:
            {"skills": [...], "domains": [...]}
        """
        # 检查 description 是否有效
        if not self._is_valid_description(description):
            logger.debug(
                "invalid_description_skipped",
                name=name,
                description_preview=description[:50] if description else None
            )
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
        """使用 LLM 进行分类"""

        # Anthropic 使用特殊的调用方式（保持向后兼容）
        if self.llm_provider.lower() == "anthropic":
            return await self._anthropic_classify(name, description)

        # 其他提供商使用 OpenAI SDK（统一接口）
        prompt = self._build_prompt(name, description)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的 AI Agent 分类器，基于 OASF 标准分类体系工作。只返回 JSON 格式的结果，不要包含任何其他文字。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},  # 强制 JSON 输出（参考 herAI MBTI 服务）
                temperature=0.3,
                max_tokens=1024
            )

            content = response.choices[0].message.content
            classification = json.loads(content)

            # 验证结果
            skills = [s for s in classification.get("skills", []) if s in OASF_SKILLS]
            domains = [d for d in classification.get("domains", []) if d in OASF_DOMAINS]

            logger.info(
                "llm_classification_success",
                provider=self.llm_provider,
                model=self.model_name,
                name=name,
                skills_count=len(skills),
                domains_count=len(domains)
            )

            return {
                "skills": skills[:5],
                "domains": domains[:3]
            }

        except Exception as e:
            logger.error("llm_api_call_failed", error=str(e), provider=self.llm_provider)
            raise

    async def _anthropic_classify(self, name: str, description: str) -> Dict[str, List[str]]:
        """使用 Anthropic API 进行分类（保持向后兼容）"""
        import httpx

        prompt = self._build_prompt(name, description)

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                self.api_url,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model_name,
                    "max_tokens": 1024,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )

            response.raise_for_status()
            result = response.json()
            content = result["content"][0]["text"]

            # 提取 JSON
            try:
                classification = json.loads(content)
            except json.JSONDecodeError:
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
                "anthropic_classification_success",
                name=name,
                skills_count=len(skills),
                domains_count=len(domains)
            )

            return {
                "skills": skills[:5],
                "domains": domains[:3]
            }

    def _build_prompt(self, name: str, description: str) -> str:
        """构建分类提示词（提供完整列表，确保准确分类）"""
        # 提供完整的 skills 和 domains 列表（作为紧凑的字符串列表）
        all_skills = list(OASF_SKILLS)
        all_domains = list(OASF_DOMAINS)

        return f"""分析以下 AI Agent，并从 OASF 分类体系中选择最合适的 skills 和 domains。

Agent 名称: {name}
Agent 描述: {description}

可用的 Skills（共 {len(all_skills)} 个，选择最多 5 个最相关的）:
{json.dumps(all_skills, ensure_ascii=False)}

可用的 Domains（共 {len(all_domains)} 个，选择最多 3 个最相关的）:
{json.dumps(all_domains, ensure_ascii=False)}

分析指南：
1. Skills: 关注 agent 的功能和技术能力（如代码生成、数据处理、图像分类等）
2. Domains: 关注 agent 的应用领域（如教育、金融、医疗、区块链等）
3. 优先选择最具体和相关的分类

返回格式（只返回 JSON，不要其他内容）:
{{
  "skills": ["skill1", "skill2", ...],
  "domains": ["domain1", "domain2", ...]
}}"""

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
