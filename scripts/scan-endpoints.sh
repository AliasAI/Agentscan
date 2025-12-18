#!/bin/bash
# Endpoint Scanner Script
#
# Scans all agents' endpoints and saves results to database.
# Results are stored permanently and can be viewed on the frontend.
#
# Usage:
#   ./scripts/scan-endpoints.sh                    # Scan unchecked agents
#   ./scripts/scan-endpoints.sh --force            # Re-scan all agents
#   ./scripts/scan-endpoints.sh --network sepolia  # Filter by network
#   ./scripts/scan-endpoints.sh --limit 100        # Limit agents

set -e

cd "$(dirname "$0")/.."

echo "🔍 Endpoint Scanner"
echo "==================="
echo ""

cd backend && uv run python -m src.scripts.scan_endpoints "$@"
