#!/bin/bash

# Database migration script
# 数据库迁移脚本

cd "$(dirname "$0")/../backend"

echo "🔧 Running database migration..."
uv run python -m src.db.migrate_add_contracts
