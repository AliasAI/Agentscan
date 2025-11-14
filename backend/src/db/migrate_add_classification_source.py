"""添加 classification_source 字段来区分分类来源

字段值:
- None: 未分类
- 'metadata': 从 agent metadata 提取（OASF 标准格式）
- 'ai': AI 自动分类
"""

import sqlite3
from dotenv import load_dotenv
import os

load_dotenv()


def migrate():
    """添加 classification_source 字段"""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./8004scan.db")
    db_path = database_url.replace("sqlite:///", "")

    print(f"📊 Connecting to database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(agents)")
        columns = [column[1] for column in cursor.fetchall()]

        if "classification_source" in columns:
            print("✅ 'classification_source' 字段已存在，跳过")
            return

        # 添加字段
        print("Adding 'classification_source' column...")
        cursor.execute("""
            ALTER TABLE agents
            ADD COLUMN classification_source VARCHAR(20)
        """)

        conn.commit()
        print("✅ Successfully added 'classification_source' column")

    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

    print("迁移完成！")


if __name__ == "__main__":
    migrate()
