# Analytics Integer Overflow Hotfix

## Issue

API endpoint `/api/analytics/overview` was failing with:
```
sqlite3.OperationalError: integer overflow
```

**Root Cause**: SQLite's `SUM()` function was overflowing when summing `BigInteger` fields (`gas_used`, `transaction_fee`) containing large wei values.

## Solution

Modified `backend/src/api/analytics.py` to cast BigInteger fields to Float before summing:

```python
# Before (causes overflow)
func.sum(Activity.gas_used)
func.sum(Activity.transaction_fee)

# After (fixed)
func.sum(cast(Activity.gas_used, Float))
func.sum(cast(Activity.transaction_fee, Float))
```

This prevents integer overflow by performing floating-point arithmetic, which has a much larger range.

## Additional Changes

- Updated BSC network config with correct vanity addresses
- Added BSC deployment documentation

## Deployment Steps

### Option 1: Quick Deploy (SSH to server)

```bash
# SSH to server
ssh ubuntu@43.199.214.110

# Run deployment
cd /home/ubuntu/Agentscan
git pull origin dev
docker compose restart backend

# Verify fix
curl "http://localhost:8080/api/analytics/overview?days=30&limit=10"
```

### Option 2: Using Script

Copy the deployment script to server and run:

```bash
bash deploy-fix.sh
```

## Verification

After deployment, test the endpoint:

```bash
curl "http://43.199.214.110:8080/api/analytics/overview?days=30&limit=10"
```

Expected response should include:
```json
{
  "stats": {
    "total_transactions": 123,
    "total_gas_used": 1234567890,
    "total_fees_wei": 9876543210,
    ...
  },
  ...
}
```

## Files Modified

- `backend/src/api/analytics.py` - Fixed integer overflow
- `backend/src/core/networks_config.py` - Updated BSC config
- `docs/bsc-deployment-guide.md` - Added
- `docs/bsc-deployment-status.md` - Added

## Git Commit

```
fix: resolve integer overflow in analytics API and update BSC config

- Fix SQLite integer overflow in analytics overview endpoint
  - Cast BigInteger fields (gas_used, transaction_fee) to Float before sum()
  - Prevents overflow when summing large wei values
- Update BSC network config with vanity addresses (0x8004...)
- Add BSC deployment documentation
```

Commit: `b35d6e8`
Branch: `dev`

## Impact

- **Before**: Analytics API returning 500 errors
- **After**: Analytics API returns correct statistics
- **Risk**: Low - only changes aggregation method, doesn't affect data storage
- **Downtime**: ~10 seconds (backend restart)

## Testing

Tested locally with:
```bash
curl "http://localhost:8000/api/analytics/overview?days=30&limit=10"
```

Result: ✅ No errors, returns valid JSON with statistics

## Rollback Plan

If issues occur:
```bash
git checkout master
docker compose restart backend
```
