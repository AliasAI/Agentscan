"""清除基于无效描述的错误分类

这个脚本会：
1. 检查所有已分类的 agents
2. 验证其 description 是否有效
3. 清除无效描述的 agents 的分类（设置 skills 和 domains 为空）
"""

import asyncio
from src.db.database import SessionLocal
from src.models.agent import Agent
from src.services.ai_classifier import ai_classifier_service
import structlog

logger = structlog.get_logger(__name__)


def clean_invalid_classifications():
    """清除基于无效描述的分类"""

    with SessionLocal() as db:
        # 获取所有已分类的 agents
        classified_agents = db.query(Agent).filter(
            (Agent.skills != None) & (Agent.skills != "[]")
        ).all()

        print(f"📊 总共找到 {len(classified_agents)} 个已分类的 agents")
        print("检查哪些分类基于无效描述...\n")

        cleaned_count = 0
        kept_count = 0

        for agent in classified_agents:
            # 使用分类器的验证方法检查描述是否有效
            is_valid = ai_classifier_service._is_valid_description(agent.description)

            if not is_valid:
                # 清除分类
                print(f"❌ 清除: {agent.name} (Token ID: {agent.token_id})")
                print(f"   原因: 无效描述")
                print(f"   描述: '{agent.description[:60]}...' ({len(agent.description or '')} 字符)")
                print(f"   之前的分类: {len(agent.skills or [])} skills, {len(agent.domains or [])} domains")

                agent.skills = []
                agent.domains = []
                cleaned_count += 1
                print()
            else:
                kept_count += 1

        # 提交更改
        db.commit()

        print("=" * 80)
        print(f"清理完成！")
        print(f"  ✅ 保留有效分类: {kept_count}")
        print(f"  ❌ 清除无效分类: {cleaned_count}")
        print(f"  📊 总计: {len(classified_agents)}")
        print("=" * 80)

        return cleaned_count, kept_count


if __name__ == "__main__":
    print("=" * 80)
    print("清除基于无效描述的错误分类")
    print("=" * 80)
    print()

    confirm = input("确认要清除无效描述的分类吗？(y/N): ")
    if confirm.lower() != 'y':
        print("已取消")
        exit(0)

    print()
    cleaned, kept = clean_invalid_classifications()

    if cleaned > 0:
        print()
        print(f"💡 提示: 现在可以运行后台分类任务重新分类有效的 agents：")
        print(f"   ./classify_background.sh start 1737 20")
