"""Verify gas data statistics"""

from dotenv import load_dotenv
load_dotenv()

from src.db.database import SessionLocal
from src.models import Activity
from sqlalchemy import func

db = SessionLocal()

# Get statistics
total = db.query(Activity).count()
with_gas = db.query(Activity).filter(Activity.gas_used.isnot(None)).count()
total_gas = db.query(func.sum(Activity.gas_used)).scalar() or 0
total_fees_wei = db.query(func.sum(Activity.transaction_fee)).scalar() or 0
total_fees_eth = total_fees_wei / 1e18
avg_fee_eth = total_fees_eth / total if total > 0 else 0

print('='*60)
print('📊 GAS DATA VERIFICATION')
print('='*60)
print(f'Total activities: {total:,}')
print(f'Activities with gas data: {with_gas:,} ({with_gas/total*100:.1f}%)')
print()
print('💰 FEE STATISTICS:')
print(f'Total Gas Used: {total_gas:,}')
print(f'Total Fees (wei): {total_fees_wei:,}')
print(f'Total Fees (ETH): {total_fees_eth:.6f} ETH')
print(f'Total Fees (USD): ${total_fees_eth * 3500:.2f} (@ $3,500/ETH)')
print()
print('📈 AVERAGE PER TRANSACTION:')
print(f'Avg Fee (ETH): {avg_fee_eth:.8f} ETH')
print(f'Avg Fee (mETH): {avg_fee_eth * 1000:.5f} mETH')
print(f'Avg Fee (Gwei): {avg_fee_eth * 1e9:.2f} Gwei')
print(f'Avg Fee (USD): ${avg_fee_eth * 3500:.4f}')
print('='*60)

db.close()
