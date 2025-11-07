"""Test blockchain sync manually"""

import asyncio
from src.services.blockchain_sync import blockchain_sync_service

async def main():
    print("Starting manual blockchain sync...")
    try:
        await blockchain_sync_service.sync()
        print("Sync completed successfully!")
    except Exception as e:
        print(f"Sync failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
