#!/bin/bash

# Fast sync script - runs sync multiple times to catch up quickly

echo "Starting fast sync..."
echo "Current time: $(date)"

for i in {1..15}; do
  echo ""
  echo "=== Sync run $i ==="
  uv run python test_sync.py 2>&1 | grep -E "(sync_started|events_found|sync_completed|agent_created|processing_agent)"
  sleep 1
done

echo ""
echo "Fast sync completed!"
echo "Current time: $(date)"
