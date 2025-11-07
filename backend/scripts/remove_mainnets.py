"""Remove mainnet networks from database"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.db.database import SessionLocal
from src.models import Network
import structlog

logger = structlog.get_logger()


def remove_mainnets():
    """Remove mainnet networks from database"""
    db = SessionLocal()

    try:
        # Chain IDs to remove: Ethereum Mainnet (1), Polygon (137), Arbitrum (42161)
        mainnet_chain_ids = [1, 137, 42161]

        logger.info("查询需要删除的主网...")
        mainnets = db.query(Network).filter(Network.chain_id.in_(mainnet_chain_ids)).all()

        if not mainnets:
            logger.info("没有找到需要删除的主网")
            return

        logger.info(f"找到 {len(mainnets)} 个主网需要删除:")
        for network in mainnets:
            logger.info(f"  - {network.name} (Chain ID: {network.chain_id})")

        # Delete mainnets
        for network in mainnets:
            db.delete(network)
            logger.info(f"已删除: {network.name}")

        db.commit()
        logger.info("✅ 主网删除成功！")

        # Verify remaining networks
        logger.info("\n剩余的网络:")
        remaining = db.query(Network).all()
        for network in remaining:
            logger.info(f"  - {network.name} (Chain ID: {network.chain_id})")

    except Exception as e:
        db.rollback()
        logger.error("删除主网失败", error=str(e))
        raise
    finally:
        db.close()


if __name__ == "__main__":
    remove_mainnets()
