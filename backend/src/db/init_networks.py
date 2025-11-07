"""Initialize networks from config"""

from src.db.database import SessionLocal
from src.models import Network
from src.core.networks_config import NETWORKS


def init_networks():
    """Initialize networks from configuration"""

    db = SessionLocal()

    try:
        added_count = 0
        updated_count = 0

        # Process each network in config
        for network_key, config in NETWORKS.items():
            if not config.get("enabled", True):
                continue

            # Check if network already exists (by chain_id)
            existing_network = db.query(Network).filter(
                Network.chain_id == config["chain_id"]
            ).first()

            if existing_network:
                # Update contracts if not set
                if not existing_network.contracts and "contracts" in config:
                    existing_network.contracts = config["contracts"]
                    updated_count += 1
                    print(f"✅ Updated contracts for {existing_network.name}")
            else:
                # Create new network
                network = Network(
                    name=config["name"],
                    chain_id=config["chain_id"],
                    rpc_url=config["rpc_url"],
                    explorer_url=config["explorer_url"],
                    contracts=config.get("contracts"),
                )
                db.add(network)
                added_count += 1
                has_contracts = "✓" if network.contracts else "✗"
                print(f"✅ Added network: {network.name} (Chain ID: {network.chain_id}) [Contracts: {has_contracts}]")

        db.commit()

        # Summary
        total_count = db.query(Network).count()
        if added_count > 0 or updated_count > 0:
            print(f"\n📊 Network initialization summary:")
            print(f"   - Added: {added_count}")
            print(f"   - Updated: {updated_count}")
            print(f"   - Total networks: {total_count}")
        else:
            print(f"✅ All {total_count} networks already initialized")

    except Exception as e:
        print(f"❌ Error initializing networks: {e}")
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    init_networks()
