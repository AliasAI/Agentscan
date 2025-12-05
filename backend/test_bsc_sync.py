"""Test BSC Testnet blockchain sync"""

import asyncio
from src.services.blockchain_sync import sync_bsc_testnet

async def main():
    print("=" * 60)
    print("🚀 Starting BSC Testnet sync...")
    print("=" * 60)
    try:
        await sync_bsc_testnet()
        print("\n" + "=" * 60)
        print("✅ BSC Testnet sync completed!")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Sync failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
