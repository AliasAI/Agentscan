#!/bin/bash

# Graceful update script - minimizes downtime by pre-building images
# Usage:
#   ./scripts/docker-update.sh              # Update both services
#   ./scripts/docker-update.sh backend      # Update backend only
#   ./scripts/docker-update.sh frontend     # Update frontend only

set -e

cd "$(dirname "$0")/.."

SERVICE="${1:-all}"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[UPDATE]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

wait_for_health() {
    local max_wait=60
    local elapsed=0
    log "Waiting for backend health check..."
    while [ $elapsed -lt $max_wait ]; do
        if docker compose exec -T backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" 2>/dev/null; then
            log "Backend is healthy! (${elapsed}s)"
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        printf "."
    done
    echo ""
    err "Backend failed health check after ${max_wait}s"
    return 1
}

# Phase 1: Pre-build images (no downtime during this phase)
log "Phase 1: Building images (no downtime)..."
if [ "$SERVICE" = "all" ]; then
    docker compose build backend frontend
elif [ "$SERVICE" = "backend" ] || [ "$SERVICE" = "frontend" ]; then
    docker compose build "$SERVICE"
else
    err "Unknown service: $SERVICE (use: backend, frontend, or all)"
    exit 1
fi

# Phase 2: Rolling restart (minimal downtime)
log "Phase 2: Rolling restart..."

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "backend" ]; then
    log "Restarting backend..."
    docker compose up -d --no-deps backend
    wait_for_health
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "frontend" ]; then
    log "Restarting frontend..."
    docker compose up -d --no-deps frontend
fi

# Phase 3: Verify
log "Phase 3: Verifying..."
docker compose ps

log "Update complete!"
