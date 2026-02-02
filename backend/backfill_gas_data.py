"""Backfill gas data for existing activities with tx_hash"""

from dotenv import load_dotenv
load_dotenv()

from src.db.database import SessionLocal
from src.models import Activity
from web3 import Web3
from src.core.networks_config import get_network
import structlog

logger = structlog.get_logger()


def backfill_gas_data(limit: int = 100):
    """Backfill gas data for activities that have tx_hash but no gas data"""

    db = SessionLocal()

    try:
        # Get activities with tx_hash but no gas data
        activities = (
            db.query(Activity)
            .filter(
                Activity.tx_hash.isnot(None),
                Activity.gas_used.is_(None)
            )
            .limit(limit)
            .all()
        )

        if not activities:
            print("✅ No activities need gas data backfill")
            return

        print(f"📊 Found {len(activities)} activities to backfill")

        # Initialize Web3 connection for Ethereum mainnet
        network_config = get_network('ethereum')
        if not network_config:
            print("❌ Ethereum network config not found")
            return

        w3 = Web3(Web3.HTTPProvider(network_config['rpc_url']))

        if not w3.is_connected():
            print("❌ Failed to connect to Ethereum RPC")
            return

        print(f"✅ Connected to Ethereum RPC")

        success_count = 0
        error_count = 0

        for i, activity in enumerate(activities, 1):
            try:
                print(f"[{i}/{len(activities)}] Processing tx: {activity.tx_hash[:10]}...")

                # Get transaction receipt and transaction
                receipt = w3.eth.get_transaction_receipt(activity.tx_hash)
                transaction = w3.eth.get_transaction(activity.tx_hash)

                gas_used = receipt.get('gasUsed')
                gas_price = transaction.get('gasPrice')

                if gas_used and gas_price:
                    transaction_fee = gas_used * gas_price

                    # Update activity
                    activity.gas_used = gas_used
                    activity.gas_price = gas_price
                    activity.transaction_fee = transaction_fee

                    success_count += 1

                    # Commit every 10 transactions
                    if i % 10 == 0:
                        db.commit()
                        print(f"  ✅ Committed {i} transactions")
                else:
                    print(f"  ⚠️ Missing gas data for {activity.tx_hash[:10]}")
                    error_count += 1

            except Exception as e:
                print(f"  ❌ Error processing {activity.tx_hash[:10]}: {e}")
                error_count += 1
                continue

        # Final commit
        db.commit()

        print(f"\n🎉 Backfill completed:")
        print(f"  ✅ Success: {success_count}")
        print(f"  ❌ Errors: {error_count}")

        # Show statistics
        total_fees_wei = db.query(Activity).filter(Activity.transaction_fee.isnot(None)).with_entities(
            Activity.transaction_fee
        ).all()

        total = sum(fee[0] for fee in total_fees_wei if fee[0])
        total_eth = total / 1e18

        print(f"\n📈 Statistics:")
        print(f"  Total fees: {total_eth:.6f} ETH ({total:,} wei)")

    except Exception as e:
        print(f"❌ Fatal error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 100

    print(f"🔄 Starting gas data backfill (limit: {limit})...")
    backfill_gas_data(limit)
