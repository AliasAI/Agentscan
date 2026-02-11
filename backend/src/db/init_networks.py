"""Initialize networks from config"""

from src.db.database import SessionLocal
from src.models import Network, Agent
from src.core.networks_config import NETWORKS


def init_networks():
    """Initialize networks from configuration"""

    db = SessionLocal()

    try:
        added_count = 0
        updated_count = 0
        deleted_count = 0
        migrated_count = 0

        # Legacy network mappings: old_key -> new_key
        # Used to migrate agents from deprecated networks to new ones
        # Set new_key to None to delete without migration
        legacy_mappings = {
            "bsc": "bsc-1",  # Old bsc migrates to bsc-1 (CREATE2 deployment)
            "bsc-2": None,   # Vanity deployment, no longer used
            "hedera-testnet": None,
            "hyperevm-testnet": None,
            "skale-testnet": None,
            "base-sepolia": None,
            "linea-sepolia": None,
            "polygon-amoy": None,
        }

        # STEP 1: Create/update all networks from config FIRST
        # This ensures target networks exist before migration
        for network_key, config in NETWORKS.items():
            if not config.get("enabled", True):
                continue

            existing_network = db.query(Network).filter(
                Network.id == network_key
            ).first()

            if existing_network:
                # Update contracts if not set
                if not existing_network.contracts and "contracts" in config:
                    existing_network.contracts = config["contracts"]
                    updated_count += 1
                    print(f"✅ Updated contracts for {existing_network.name}")
                # Update name if changed
                if existing_network.name != config["name"]:
                    existing_network.name = config["name"]
                    updated_count += 1
                    print(f"✅ Updated name for {network_key}: {config['name']}")
            else:
                # Create new network with network_key as id
                network = Network(
                    id=network_key,
                    name=config["name"],
                    chain_id=config["chain_id"],
                    rpc_url=config["rpc_url"],
                    explorer_url=config["explorer_url"],
                    contracts=config.get("contracts"),
                )
                db.add(network)
                added_count += 1
                has_contracts = "✓" if network.contracts else "✗"
                print(f"✅ Added network: {network.name} (ID: {network_key}, Chain ID: {network.chain_id}) [Contracts: {has_contracts}]")

        # Flush to ensure new networks exist before migration
        db.flush()

        # STEP 2: Handle legacy network migrations
        # Now that target networks exist, we can safely migrate agents
        for old_key, new_key in legacy_mappings.items():
            old_network = db.query(Network).filter(Network.id == old_key).first()
            if not old_network:
                continue

            # Check if there are agents associated with this network
            agent_count = db.query(Agent).filter(Agent.network_id == old_key).count()

            if agent_count > 0 and new_key:
                # Verify target network exists
                target_network = db.query(Network).filter(Network.id == new_key).first()
                if not target_network:
                    print(f"⚠️ Cannot migrate {old_key}: target network {new_key} does not exist")
                    continue

                # Migrate agents to new network first (using SQL update to avoid ORM cascade issues)
                db.query(Agent).filter(Agent.network_id == old_key).update(
                    {Agent.network_id: new_key},
                    synchronize_session='fetch'
                )
                migrated_count += agent_count
                print(f"📦 Migrated {agent_count} agents: {old_key} -> {new_key}")

                # Now safe to delete the old network
                db.delete(old_network)
                deleted_count += 1
                print(f"🗑️ Deleted legacy network: {old_key}")

            elif agent_count > 0 and not new_key:
                # Cannot delete - has agents and no migration target
                print(f"⚠️ Skipped deletion of {old_key}: has {agent_count} agents and no migration target")

            else:
                # No agents, safe to delete
                db.delete(old_network)
                deleted_count += 1
                print(f"🗑️ Deleted legacy network: {old_key}")

        db.commit()

        # Summary
        total_count = db.query(Network).count()
        if added_count > 0 or updated_count > 0 or deleted_count > 0 or migrated_count > 0:
            print(f"\n📊 Network initialization summary:")
            print(f"   - Added: {added_count}")
            print(f"   - Updated: {updated_count}")
            print(f"   - Deleted: {deleted_count}")
            if migrated_count > 0:
                print(f"   - Agents migrated: {migrated_count}")
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
