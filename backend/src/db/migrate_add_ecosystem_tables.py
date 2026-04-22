"""Migration: add ecosystem and capability tables."""

import sqlite3

import structlog

from src.core.config import settings

logger = structlog.get_logger()


TABLE_DEFINITIONS = {
    "agent_ecosystem_links": """
        CREATE TABLE agent_ecosystem_links (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            ecosystem_name TEXT NOT NULL,
            source_url TEXT,
            external_id TEXT,
            metadata_json TEXT,
            confidence_score REAL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY(agent_id) REFERENCES agents(id)
        )
    """,
    "agent_capabilities": """
        CREATE TABLE agent_capabilities (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            capability_name TEXT NOT NULL,
            value_json TEXT,
            source TEXT,
            verified BOOLEAN NOT NULL DEFAULT 0,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY(agent_id) REFERENCES agents(id)
        )
    """,
    "agent_activity_snapshots": """
        CREATE TABLE agent_activity_snapshots (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            ecosystem_name TEXT NOT NULL,
            usage_7d REAL,
            usage_30d REAL,
            freshness REAL,
            snapshot_time DATETIME NOT NULL,
            FOREIGN KEY(agent_id) REFERENCES agents(id)
        )
    """,
    "ingestion_runs": """
        CREATE TABLE ingestion_runs (
            id TEXT PRIMARY KEY,
            ecosystem_name TEXT NOT NULL,
            status TEXT NOT NULL,
            started_at DATETIME NOT NULL,
            ended_at DATETIME,
            stats_json TEXT,
            error_log TEXT
        )
    """,
}


INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_agent_ecosystem_links_agent_id ON agent_ecosystem_links(agent_id)",
    "CREATE INDEX IF NOT EXISTS idx_agent_ecosystem_links_ecosystem_name ON agent_ecosystem_links(ecosystem_name)",
    "CREATE INDEX IF NOT EXISTS idx_agent_capabilities_agent_id ON agent_capabilities(agent_id)",
    "CREATE INDEX IF NOT EXISTS idx_agent_capabilities_capability_name ON agent_capabilities(capability_name)",
    "CREATE INDEX IF NOT EXISTS idx_agent_activity_snapshots_agent_id ON agent_activity_snapshots(agent_id)",
    "CREATE INDEX IF NOT EXISTS idx_agent_activity_snapshots_ecosystem_name ON agent_activity_snapshots(ecosystem_name)",
    "CREATE INDEX IF NOT EXISTS idx_ingestion_runs_ecosystem_name ON ingestion_runs(ecosystem_name)",
]


def migrate():
    """Create ecosystem-oriented tables if they do not already exist."""
    conn = sqlite3.connect(settings.database_url.replace("sqlite:///", ""))
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = {row[0] for row in cursor.fetchall()}

        created = []
        for table_name, ddl in TABLE_DEFINITIONS.items():
            if table_name in existing_tables:
                continue
            cursor.execute(ddl)
            created.append(table_name)

        for stmt in INDEX_STATEMENTS:
            cursor.execute(stmt)

        conn.commit()

        if created:
            logger.info("migration_add_ecosystem_tables", created_tables=created)
        else:
            logger.debug("migration_add_ecosystem_tables_skipped", reason="tables_exist")
    except Exception as e:
        logger.error("migration_add_ecosystem_tables_failed", error=str(e))
        raise
    finally:
        conn.close()
