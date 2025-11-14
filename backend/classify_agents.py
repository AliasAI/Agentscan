"""批量分类 agents 的脚本

使用方法：
    uv run python classify_agents.py [limit]

示例：
    uv run python classify_agents.py 10      # 分类前 10 个
    uv run python classify_agents.py 100     # 分类前 100 个
    uv run python classify_agents.py all     # 分类所有（1733 个）
"""

import sys
import asyncio
from src.db.database import SessionLocal
from src.models.agent import Agent
from src.services.ai_classifier import ai_classifier_service
import structlog

logger = structlog.get_logger(__name__)


async def classify_agents(limit: int = None):
    """批量分类 agents"""

    with SessionLocal() as db:
        # 获取未分类的 agents
        query = db.query(Agent).filter(
            (Agent.skills == None) | (Agent.skills == "[]")
        )

        if limit:
            query = query.limit(limit)
            agents = query.all()
            print(f"准备分类前 {limit} 个未分类的 agents...")
        else:
            agents = query.all()
            print(f"准备分类所有 {len(agents)} 个未分类的 agents...")

        if not agents:
            print("✅ 所有 agents 都已分类！")
            return

        print(f"开始分类 {len(agents)} 个 agents...\n")

        classified_count = 0
        failed_count = 0

        for i, agent in enumerate(agents, 1):
            try:
                # 显示进度
                print(f"[{i}/{len(agents)}] 分类: {agent.name} (ID: {agent.id})")

                # 调用 AI 分类
                classification = await ai_classifier_service.classify_agent(
                    agent.name,
                    agent.description
                )

                # 更新数据库
                agent.skills = classification.get("skills", [])
                agent.domains = classification.get("domains", [])
                db.commit()

                classified_count += 1

                print(f"  ✅ Skills: {len(agent.skills)} | Domains: {len(agent.domains)}")
                if agent.skills:
                    print(f"     {', '.join(agent.skills[:3])}")
                if agent.domains:
                    print(f"     {', '.join(agent.domains[:2])}")
                print()

            except Exception as e:
                failed_count += 1
                print(f"  ❌ 分类失败: {str(e)}\n")
                logger.error("classification_failed", agent_id=agent.id, error=str(e))

        print("=" * 70)
        print(f"分类完成！")
        print(f"  成功: {classified_count}")
        print(f"  失败: {failed_count}")
        print(f"  总计: {classified_count + failed_count}")
        print("=" * 70)


if __name__ == "__main__":
    # 解析命令行参数
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg.lower() == "all":
            limit = None
            print("⚠️  将分类所有 agents，这可能需要较长时间...")
            confirm = input("是否继续？(y/N): ")
            if confirm.lower() != 'y':
                print("已取消")
                sys.exit(0)
        else:
            try:
                limit = int(arg)
            except ValueError:
                print(f"错误: 无效的参数 '{arg}'")
                print("使用方法: uv run python classify_agents.py [limit|all]")
                sys.exit(1)
    else:
        limit = 10  # 默认只分类 10 个（测试）
        print(f"未指定数量，默认分类前 {limit} 个 agents")

    asyncio.run(classify_agents(limit))
