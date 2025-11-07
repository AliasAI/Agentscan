"""
初始化网络配置到数据库

将 networks_config.py 中配置的网络添加到数据库
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db.database import SessionLocal
from src.models import Network
from src.core.networks_config import get_enabled_networks
import structlog

logger = structlog.get_logger()


def init_networks():
    """Initialize networks in database"""
    db = SessionLocal()

    try:
        networks = get_enabled_networks()
        logger.info("initializing_networks", count=len(networks))

        created_count = 0
        updated_count = 0

        for network_key, network_config in networks.items():
            # Check if network already exists
            existing_network = db.query(Network).filter(
                Network.name == network_config["name"]
            ).first()

            if existing_network:
                # Update existing network
                existing_network.chain_id = network_config["chain_id"]
                existing_network.rpc_url = network_config["rpc_url"]
                existing_network.explorer_url = network_config["explorer_url"]
                updated_count += 1
                logger.info("network_updated", name=network_config["name"])
            else:
                # Create new network
                network = Network(
                    name=network_config["name"],
                    chain_id=network_config["chain_id"],
                    rpc_url=network_config["rpc_url"],
                    explorer_url=network_config["explorer_url"]
                )
                db.add(network)
                created_count += 1
                logger.info("network_created", name=network_config["name"])

        db.commit()

        logger.info(
            "networks_initialized",
            created=created_count,
            updated=updated_count,
            total=len(networks)
        )

        print(f"\n✅ Networks initialized!")
        print(f"   Created: {created_count}")
        print(f"   Updated: {updated_count}")
        print(f"   Total: {len(networks)}\n")

    except Exception as e:
        db.rollback()
        logger.error("network_init_failed", error=str(e))
        print(f"\n❌ Network initialization failed: {e}\n")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🌐 Initializing networks...\n")
    init_networks()
