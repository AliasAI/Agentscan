#!/bin/bash
# Endpoint Health Check Script
#
# Usage:
#   ./scripts/check-endpoints.sh                    # Console output
#   ./scripts/check-endpoints.sh --json             # JSON output
#   ./scripts/check-endpoints.sh --markdown         # Markdown output
#   ./scripts/check-endpoints.sh --network sepolia  # Filter by network

set -e

cd "$(dirname "$0")/.."

# Default values
OUTPUT="console"
NETWORK=""
LIMIT=""
FILE=""
ONLY_WORKING=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            OUTPUT="json"
            FILE="${2:-reports/endpoint-health-$(date +%Y%m%d-%H%M%S).json}"
            shift
            ;;
        --markdown|--md)
            OUTPUT="markdown"
            FILE="${2:-reports/endpoint-health-$(date +%Y%m%d-%H%M%S).md}"
            shift
            ;;
        --network)
            NETWORK="$2"
            shift 2
            ;;
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        --only-working)
            ONLY_WORKING="--only-working"
            shift
            ;;
        --file)
            FILE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Endpoint Health Check Script"
            echo ""
            echo "Usage: ./scripts/check-endpoints.sh [options]"
            echo ""
            echo "Options:"
            echo "  --json              Output as JSON (saves to reports/)"
            echo "  --markdown, --md    Output as Markdown (saves to reports/)"
            echo "  --network NETWORK   Filter by network (e.g., sepolia)"
            echo "  --limit N           Limit number of agents to check"
            echo "  --only-working      Only show agents with working endpoints"
            echo "  --file PATH         Custom output file path"
            echo "  -h, --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/check-endpoints.sh"
            echo "  ./scripts/check-endpoints.sh --json"
            echo "  ./scripts/check-endpoints.sh --markdown --network sepolia"
            echo "  ./scripts/check-endpoints.sh --limit 50 --only-working"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create reports directory if needed
if [[ -n "$FILE" ]]; then
    mkdir -p "$(dirname "$FILE")"
fi

# Build command
CMD="cd backend && uv run python -m src.scripts.check_endpoints"
CMD="$CMD --output $OUTPUT"

if [[ -n "$NETWORK" ]]; then
    CMD="$CMD --network $NETWORK"
fi

if [[ -n "$LIMIT" ]]; then
    CMD="$CMD --limit $LIMIT"
fi

if [[ -n "$FILE" ]]; then
    CMD="$CMD --file ../$FILE"
fi

if [[ -n "$ONLY_WORKING" ]]; then
    CMD="$CMD $ONLY_WORKING"
fi

echo "🔍 Running endpoint health check..."
echo ""

eval $CMD

if [[ -n "$FILE" && -f "$FILE" ]]; then
    echo ""
    echo "📄 Report saved to: $FILE"
fi
