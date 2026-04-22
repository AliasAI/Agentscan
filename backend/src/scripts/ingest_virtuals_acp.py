"""Manual runner for Virtuals ACP ingestion."""

import argparse
import asyncio

from src.db.database import Base, engine
from src.db.migrate_add_ecosystem_tables import migrate as migrate_add_ecosystem_tables
from src.db.init_networks import init_networks
from src.services.virtuals_acp_ingestion import (
    DEFAULT_QUERY_SEEDS,
    virtuals_acp_ingestion_service,
)


def parse_args():
    parser = argparse.ArgumentParser(description="Ingest Virtuals ACP discovery data")
    parser.add_argument(
        "--queries",
        default=",".join(DEFAULT_QUERY_SEEDS),
        help="Comma-separated ACP search seed queries",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=100,
        help="Maximum results per query (1-500)",
    )
    return parser.parse_args()


async def main():
    Base.metadata.create_all(bind=engine)
    migrate_add_ecosystem_tables()
    init_networks()

    args = parse_args()
    queries = [query.strip() for query in args.queries.split(",") if query.strip()]
    result = await virtuals_acp_ingestion_service.run(queries=queries, top_k=args.top_k)
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
