#!/bin/bash

# Database migration script
# 数据库迁移脚本

cd "$(dirname "$0")/.."

echo "🔧 Running database migration..."
cd backend && python -m src.db.migrate_add_contracts
