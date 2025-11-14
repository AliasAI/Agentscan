"""添加 OASF skills 和 domains 字段到 agents 表"""

import sqlite3
from dotenv import load_dotenv
import os

# 加载环境变量
load_dotenv()


def migrate():
    """添加 skills 和 domains 字段"""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./agentscan.db")
    db_path = database_url.replace("sqlite:///", "")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(agents)")
        columns = [row[1] for row in cursor.fetchall()]

        if "skills" not in columns:
            print("添加 skills 字段...")
            cursor.execute("ALTER TABLE agents ADD COLUMN skills TEXT")
            print("✓ skills 字段添加成功")
        else:
            print("skills 字段已存在，跳过")

        if "domains" not in columns:
            print("添加 domains 字段...")
            cursor.execute("ALTER TABLE agents ADD COLUMN domains TEXT")
            print("✓ domains 字段添加成功")
        else:
            print("domains 字段已存在，跳过")

        conn.commit()
        print("迁移完成！")

    except Exception as e:
        print(f"迁移失败: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
