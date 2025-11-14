"""
数据库迁移：更新 StarCard 的描述格式
将 "Star Card AI Agent for XXX - Alias AI Social Astrology Platform"
更改为 "Alias AI Agent Identity and Economy"
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.db.database import SessionLocal, engine
from src.models.agent import Agent
from sqlalchemy import text


def migrate():
    """执行迁移"""
    db = SessionLocal()

    try:
        print("开始迁移：更新 StarCard 描述...")

        # 查找所有包含 "Star Card AI Agent" 的记录
        agents = db.query(Agent).filter(
            Agent.description.like('%Star Card AI Agent%')
        ).all()

        print(f"找到 {len(agents)} 条需要更新的记录")

        # 新的统一描述
        new_description = "Star Card AI Agent for {name} - Alias AI Agent Identity and Economy"

        # 更新每条记录
        updated_count = 0
        for agent in agents:
            old_description = agent.description
            agent.description = new_description
            updated_count += 1
            print(f"  更新 Token #{agent.token_id} ({agent.name})")
            print(f"    旧: {old_description}")
            print(f"    新: {new_description}")

        # 提交更改
        db.commit()
        print(f"\n迁移完成！成功更新 {updated_count} 条记录")

        # 验证更新结果
        print("\n验证更新结果...")
        updated_agents = db.query(Agent).filter(
            Agent.description == new_description
        ).all()
        print(f"当前有 {len(updated_agents)} 条记录使用新描述")

    except Exception as e:
        db.rollback()
        print(f"迁移失败: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
