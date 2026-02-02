"""Backfill gas information for existing activities

This script fetches gas_used, gas_price, and transaction_fee for activities
that have tx_hash but missing gas information.

Usage:
    cd backend
    uv run python -m src.scripts.backfill_gas_info [--limit N] [--network NETWORK]
"""

import argparse
import time
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from web3 import Web3

from src.db.database import SessionLocal
from src.models import Activity
from src.core.networks_config import get_enabled_networks


def get_web3_for_network(network_key: str) -> Web3:
    """Get Web3 instance for a network"""
    networks = get_enabled_networks()
    if network_key not in networks:
        raise ValueError(f"Network {network_key} not found or not enabled")

    rpc_url = networks[network_key].get('rpc_url')
    if not rpc_url:
        raise ValueError(f"No RPC URL configured for {network_key}")

    return Web3(Web3.HTTPProvider(rpc_url))


def backfill_gas_info(limit: int = None, network_key: str = None, delay: float = 0.2):
    """Backfill gas information for activities missing it"""

    db = SessionLocal()

    try:
        # Build query for activities missing gas info
        query = db.query(Activity).filter(
            Activity.tx_hash.isnot(None),
            Activity.gas_used.is_(None)
        )

        if network_key:
            # Filter by network through agent relationship
            query = query.join(Activity.agent).filter(
                Activity.agent.has(network_id=network_key)
            )

        if limit:
            query = query.limit(limit)

        activities = query.all()
        total = len(activities)

        if total == 0:
            print("No activities found that need gas info backfill")
            return

        print(f"Found {total} activities to backfill")

        # Group by network for efficient Web3 instance reuse
        by_network: dict[str, list[Activity]] = {}
        for activity in activities:
            nk = activity.agent.network_id if activity.agent else 'unknown'
            if nk not in by_network:
                by_network[nk] = []
            by_network[nk].append(activity)

        success = 0
        failed = 0

        for nk, network_activities in by_network.items():
            print(f"\nProcessing {len(network_activities)} activities for network: {nk}")

            try:
                w3 = get_web3_for_network(nk)
            except Exception as e:
                print(f"  Failed to connect to {nk}: {e}")
                failed += len(network_activities)
                continue

            for i, activity in enumerate(network_activities, 1):
                try:
                    tx_hash = activity.tx_hash

                    # Fetch receipt and transaction
                    receipt = w3.eth.get_transaction_receipt(tx_hash)
                    transaction = w3.eth.get_transaction(tx_hash)

                    gas_used = receipt.get('gasUsed')
                    gas_price = transaction.get('gasPrice')
                    transaction_fee = None

                    if gas_used is not None and gas_price is not None:
                        transaction_fee = gas_used * gas_price

                    # Update activity
                    activity.gas_used = gas_used
                    activity.gas_price = gas_price
                    activity.transaction_fee = transaction_fee

                    success += 1

                    if i % 50 == 0:
                        db.commit()
                        print(f"  Progress: {i}/{len(network_activities)} "
                              f"(success: {success}, failed: {failed})")

                    # Rate limiting
                    time.sleep(delay)

                except Exception as e:
                    failed += 1
                    print(f"  Failed to get gas for {activity.tx_hash[:16]}...: {e}")
                    continue

            # Commit remaining
            db.commit()

        print(f"\n{'='*50}")
        print(f"Backfill complete!")
        print(f"  Success: {success}")
        print(f"  Failed: {failed}")
        print(f"  Total: {total}")

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Backfill gas information for activities"
    )
    parser.add_argument(
        '--limit', '-l', type=int, default=None,
        help='Maximum number of activities to process'
    )
    parser.add_argument(
        '--network', '-n', type=str, default=None,
        help='Only process activities for this network'
    )
    parser.add_argument(
        '--delay', '-d', type=float, default=0.2,
        help='Delay between RPC calls in seconds (default: 0.2)'
    )

    args = parser.parse_args()

    print(f"Starting gas info backfill at {datetime.now()}")
    print(f"  Limit: {args.limit or 'unlimited'}")
    print(f"  Network: {args.network or 'all'}")
    print(f"  Delay: {args.delay}s")
    print()

    backfill_gas_info(
        limit=args.limit,
        network_key=args.network,
        delay=args.delay
    )


if __name__ == "__main__":
    main()
