#!/bin/bash
# Backfill gas information for activities missing it

set -e

cd "$(dirname "$0")/.."

echo "======================================"
echo "Backfill Gas Info for Activities"
echo "======================================"

cd backend

# Default values
LIMIT=""
NETWORK=""
DELAY="0.2"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --limit|-l)
            LIMIT="--limit $2"
            shift 2
            ;;
        --network|-n)
            NETWORK="--network $2"
            shift 2
            ;;
        --delay|-d)
            DELAY="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--limit N] [--network NETWORK] [--delay SECONDS]"
            exit 1
            ;;
    esac
done

echo "Running backfill script..."
uv run python -m src.scripts.backfill_gas_info $LIMIT $NETWORK --delay $DELAY
