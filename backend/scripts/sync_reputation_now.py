"""
手动触发 reputation 同步

这个脚本会立即执行一次 reputation 同步，不需要等待定时任务。
使用并发请求来加速同步过程。
"""

import sys
from pathlib import Path
import asyncio

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.services.reputation_sync import reputation_sync_service
import structlog

logger = structlog.get_logger()


async def main():
    """Execute reputation sync"""
    print("\n🔄 开始同步 Reputation 数据...\n")

    try:
        await reputation_sync_service.sync()
        print("\n✅ Reputation 同步完成！\n")
    except Exception as e:
        logger.error("reputation_sync_failed", error=str(e))
        print(f"\n❌ Reputation 同步失败: {e}\n")
        raise


if __name__ == "__main__":
    asyncio.run(main())
