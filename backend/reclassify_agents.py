"""重新分类 agents 的脚本

使用方法：
    uv run python reclassify_agents.py [mode] [limit]

模式:
    invalid-only  - 只清除并重新分类基于无效描述的 agents（推荐）
    all           - 清除并重新分类所有 agents
    failed-only   - 只重新分类之前失败的 agents

示例:
    uv run python reclassify_agents.py invalid-only     # 只处理无效描述
    uv run python reclassify_agents.py all 100          # 重新分类前 100 个
"""

import sys
import asyncio
from src.db.database import SessionLocal
from src.models.agent import Agent
from src.services.ai_classifier import ai_classifier_service
import structlog

logger = structlog.get_logger(__name__)


async def reclassify_invalid_only(limit: int = None):
    """只重新分类基于无效描述的 agents"""

    with SessionLocal() as db:
        # 获取所有已分类的 agents
        query = db.query(Agent).filter(
            (Agent.skills != None) & (Agent.skills != "[]")
        )

        if limit:
            query = query.limit(limit)

        agents = query.all()

        print(f"📊 检查 {len(agents)} 个已分类的 agents...")
        print()

        to_reclassify = []

        # 找出需要清除分类的 agents
        for agent in agents:
            is_valid = ai_classifier_service._is_valid_description(agent.description)
            if not is_valid:
                to_reclassify.append(agent)

        if not to_reclassify:
            print("✅ 所有已分类的 agents 都基于有效描述，无需清除！")
            return

        print(f"找到 {len(to_reclassify)} 个基于无效描述的分类需要清除")
        print()

        confirm = input(f"确认清除这 {len(to_reclassify)} 个分类吗？(y/N): ")
        if confirm.lower() != 'y':
            print("已取消")
            return

        # 清除无效分类
        print("\n清除无效分类...")
        for agent in to_reclassify:
            print(f"  ❌ {agent.name}: '{agent.description[:50]}...'")
            agent.skills = []
            agent.domains = []

        db.commit()

        print(f"\n✅ 已清除 {len(to_reclassify)} 个无效分类")
        print("\n💡 提示: 使用后台分类任务重新分类有效的 agents：")
        print("   ./classify_background.sh start 1737 20")


async def reclassify_all(limit: int = None):
    """清除并重新分类所有 agents"""

    with SessionLocal() as db:
        # 获取所有 agents
        query = db.query(Agent)

        if limit:
            query = query.limit(limit)

        agents = query.all()

        print(f"⚠️  警告: 将清除并重新分类 {len(agents)} 个 agents")
        print()

        confirm = input("确认继续吗？这将清除所有现有分类 (y/N): ")
        if confirm.lower() != 'y':
            print("已取消")
            return

        # 清除所有分类
        print("\n清除所有分类...")
        for agent in agents:
            agent.skills = []
            agent.domains = []

        db.commit()

        print(f"\n✅ 已清除 {len(agents)} 个 agents 的分类")
        print("\n💡 提示: 使用后台分类任务重新分类：")
        print(f"   ./classify_background.sh start {len(agents)} 20")


async def reclassify_failed_only():
    """只重新分类之前失败的 agents"""

    with SessionLocal() as db:
        # 获取未分类的 agents（假设是之前失败的）
        agents = db.query(Agent).filter(
            (Agent.skills == None) | (Agent.skills == "[]")
        ).all()

        print(f"📊 找到 {len(agents)} 个未分类的 agents")
        print()

        valid_count = 0
        invalid_count = 0

        for agent in agents:
            is_valid = ai_classifier_service._is_valid_description(agent.description)
            if is_valid:
                valid_count += 1
            else:
                invalid_count += 1

        print(f"  ✅ 有效描述: {valid_count} 个")
        print(f"  ❌ 无效描述: {invalid_count} 个（将被跳过）")
        print()

        if valid_count == 0:
            print("没有可以分类的 agents（所有未分类的都是无效描述）")
            return

        confirm = input(f"确认重新分类 {valid_count} 个有效的未分类 agents 吗？(y/N): ")
        if confirm.lower() != 'y':
            print("已取消")
            return

        print("\n💡 提示: 使用后台分类任务重新分类：")
        print(f"   ./classify_background.sh start {len(agents)} 20")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "invalid-only"
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None

    print("=" * 80)
    print("重新分类 Agents")
    print("=" * 80)
    print()

    if mode == "invalid-only":
        print("模式: 只清除基于无效描述的分类（推荐）")
        print()
        asyncio.run(reclassify_invalid_only(limit))

    elif mode == "all":
        print("模式: 清除并重新分类所有 agents")
        print()
        asyncio.run(reclassify_all(limit))

    elif mode == "failed-only":
        print("模式: 只重新分类未分类的 agents")
        print()
        asyncio.run(reclassify_failed_only())

    else:
        print(f"错误: 未知模式 '{mode}'")
        print()
        print("使用方法:")
        print("  uv run python reclassify_agents.py [invalid-only|all|failed-only] [limit]")
        print()
        print("示例:")
        print("  uv run python reclassify_agents.py invalid-only     # 只清除无效描述（推荐）")
        print("  uv run python reclassify_agents.py all 100          # 重新分类前 100 个")
        print("  uv run python reclassify_agents.py failed-only      # 只处理未分类的")
