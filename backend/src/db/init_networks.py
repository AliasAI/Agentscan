"""Initialize networks from config"""

from src.db.database import SessionLocal
from src.models import Network
from src.core.networks_config import NETWORKS


def init_networks():
    """Initialize networks from configuration"""

    db = SessionLocal()

    try:
        # Check if networks already exist
        existing_count = db.query(Network).count()
        if existing_count > 0:
            print(f"Networks already initialized ({existing_count} networks found)")

            # Update existing networks with contract information
            for network_key, config in NETWORKS.items():
                network = db.query(Network).filter(
                    Network.name == config["name"]
                ).first()

                if network:
                    # Update contracts if not set
                    if not network.contracts and "contracts" in config:
                        network.contracts = config["contracts"]
                        print(f"Updated contracts for {network.name}")

            db.commit()
            return

        # Create networks from config
        networks = []
        for network_key, config in NETWORKS.items():
            if not config.get("enabled", True):
                continue

            network = Network(
                name=config["name"],
                chain_id=config["chain_id"],
                rpc_url=config["rpc_url"],
                explorer_url=config["explorer_url"],
                contracts=config.get("contracts"),
            )
            networks.append(network)

        db.add_all(networks)
        db.commit()

        print(f"✅ Successfully initialized {len(networks)} networks:")
        for network in networks:
            has_contracts = "✓" if network.contracts else "✗"
            print(f"   - {network.name} (Chain ID: {network.chain_id}) [Contracts: {has_contracts}]")

    except Exception as e:
        print(f"❌ Error initializing networks: {e}")
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    init_networks()
