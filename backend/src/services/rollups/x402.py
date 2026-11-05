"""Maintain x402 counts from a durable queue of changed Agent IDs."""

from datetime import datetime, timedelta, timezone
from time import monotonic

import structlog
from anyio import to_thread
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from src.db.database import SessionLocal, engine
from src.models import Agent, AgentCapability
from src.services.x402_agent_signals import SIGNALS, x402_signal_mask

logger = structlog.get_logger()
BATCH_SIZE = 400
BATCHES_PER_RUN = 24
SIGNAL_BITS = {name: 1 << index for index, name in enumerate(SIGNALS)}

_SCHEMA = (
    """CREATE TABLE IF NOT EXISTS x402_rollup_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        cursor TEXT NOT NULL,
        ceiling TEXT NOT NULL,
        ready INTEGER NOT NULL DEFAULT 0,
        x402 INTEGER NOT NULL DEFAULT 0,
        agentkit INTEGER NOT NULL DEFAULT 0,
        payable INTEGER NOT NULL DEFAULT 0
    )""",
    """CREATE TABLE IF NOT EXISTS x402_rollup_signals (
        agent_id TEXT PRIMARY KEY,
        mask INTEGER NOT NULL
    )""",
    "CREATE TABLE IF NOT EXISTS x402_rollup_dirty (agent_id TEXT PRIMARY KEY)",
    """INSERT OR IGNORE INTO x402_rollup_state (id, cursor, ceiling)
       VALUES (1, '', COALESCE((SELECT MAX(id) FROM agents), ''))""",
)


def _enqueue(agent_id: str) -> str:
    return (
        f"INSERT INTO x402_rollup_dirty (agent_id) VALUES ({agent_id}) "
        "ON CONFLICT(agent_id) DO NOTHING;"
    )


def install_x402_rollup() -> bool:
    if engine.dialect.name != "sqlite":
        return False
    watched_capabilities = "('x402', 'agentkit', 'payable')"
    triggers = (
        ("agent_insert", "INSERT ON agents", "", _enqueue("NEW.id")),
        ("agent_delete", "DELETE ON agents", "", _enqueue("OLD.id")),
        (
            "agent_update", "UPDATE OF id, metadata_uri, on_chain_data, description ON agents",
            "WHEN OLD.id IS NOT NEW.id OR OLD.metadata_uri IS NOT NEW.metadata_uri "
            "OR OLD.on_chain_data IS NOT NEW.on_chain_data OR OLD.description IS NOT NEW.description",
            _enqueue("OLD.id") + _enqueue("NEW.id"),
        ),
        (
            "capability_insert", "INSERT ON agent_capabilities",
            f"WHEN NEW.capability_name IN {watched_capabilities}", _enqueue("NEW.agent_id"),
        ),
        (
            "capability_delete", "DELETE ON agent_capabilities",
            f"WHEN OLD.capability_name IN {watched_capabilities}", _enqueue("OLD.agent_id"),
        ),
        (
            "capability_update", "UPDATE OF agent_id, capability_name ON agent_capabilities",
            f"WHEN OLD.capability_name IN {watched_capabilities} "
            f"OR NEW.capability_name IN {watched_capabilities}",
            _enqueue("OLD.agent_id") + _enqueue("NEW.agent_id"),
        ),
    )
    with engine.begin() as connection:
        connection.exec_driver_sql("BEGIN IMMEDIATE")
        for statement in _SCHEMA:
            result = connection.exec_driver_sql(statement)
        if result.rowcount:
            connection.exec_driver_sql(
                "INSERT OR IGNORE INTO x402_rollup_dirty (agent_id) "
                "SELECT agent_id FROM agent_capabilities WHERE capability_name IN "
                f"{watched_capabilities} AND NOT EXISTS "
                "(SELECT 1 FROM agents WHERE id = agent_capabilities.agent_id)"
            )
        for name, event, condition, body in triggers:
            connection.exec_driver_sql(
                f"CREATE TRIGGER IF NOT EXISTS x402_rollup_{name} AFTER {event} "
                f"{condition} BEGIN {body} END"
            )
    return True


def _current_masks(db: Session, ids: set[str]) -> dict[str, int]:
    masks = {
        agent_id: x402_signal_mask(uri, on_chain_data, description)
        for agent_id, uri, on_chain_data, description in db.query(
            Agent.id, Agent.metadata_uri, Agent.on_chain_data, Agent.description
        ).filter(Agent.id.in_(ids))
    }
    capabilities = db.query(AgentCapability.agent_id, AgentCapability.capability_name).filter(
        AgentCapability.agent_id.in_(ids), AgentCapability.capability_name.in_(SIGNALS)
    )
    # Preserve explicit capabilities even for legacy rows without a matching Agent.
    for agent_id, capability in capabilities:
        masks[agent_id] = masks.get(agent_id, 0) | SIGNAL_BITS[capability]
    return masks


def _update_masks(db: Session, ids: set[str]) -> list[int]:
    old = dict(db.execute(
        text("SELECT agent_id, mask FROM x402_rollup_signals WHERE agent_id IN :ids")
        .bindparams(bindparam("ids", expanding=True)),
        {"ids": list(ids)},
    ).tuples().all())
    current = _current_masks(db, ids)
    delta = [0, 0, 0]
    writes = []
    deletes = []
    for agent_id in ids:
        before, after = old.get(agent_id, 0), current.get(agent_id, 0)
        if before == after:
            continue
        for index in range(3):
            delta[index] += ((after >> index) & 1) - ((before >> index) & 1)
        if after:
            writes.append({"agent_id": agent_id, "mask": after})
        else:
            deletes.append({"agent_id": agent_id})
    if writes:
        db.execute(text(
            "INSERT INTO x402_rollup_signals (agent_id, mask) VALUES (:agent_id, :mask) "
            "ON CONFLICT(agent_id) DO UPDATE SET mask = excluded.mask"
        ), writes)
    if deletes:
        db.execute(text("DELETE FROM x402_rollup_signals WHERE agent_id = :agent_id"), deletes)
    return delta


def _apply_batch() -> bool:
    with SessionLocal.begin() as db:
        db.connection().exec_driver_sql("BEGIN IMMEDIATE")
        state = db.execute(text("SELECT * FROM x402_rollup_state WHERE id = 1")).mappings().one()
        bootstrap = []
        if not state["ready"]:
            bootstrap = db.execute(text(
                "SELECT id FROM agents WHERE id > :cursor AND id <= :ceiling "
                "ORDER BY id LIMIT :limit"
            ), {"cursor": state["cursor"], "ceiling": state["ceiling"], "limit": BATCH_SIZE}).scalars().all()

        dirty = db.execute(text(
            "SELECT agent_id FROM x402_rollup_dirty ORDER BY agent_id LIMIT :limit"
        ), {"limit": BATCH_SIZE}).scalars().all()
        if not bootstrap and not dirty and state["ready"]:
            return False

        ids = set(bootstrap) | set(dirty)
        delta = _update_masks(db, ids) if ids else [0, 0, 0]
        ready = state["ready"] or (not bootstrap and len(dirty) < BATCH_SIZE)
        db.execute(text(
            "UPDATE x402_rollup_state SET cursor = :cursor, ready = :ready, "
            "x402 = x402 + :x402, agentkit = agentkit + :agentkit, payable = payable + :payable "
            "WHERE id = 1"
        ), {
            "cursor": bootstrap[-1] if bootstrap else state["cursor"],
            "ready": int(ready),
            **dict(zip(SIGNALS, delta)),
        })
        if dirty:
            db.execute(text(
                "DELETE FROM x402_rollup_dirty WHERE agent_id = :agent_id"
            ), [{"agent_id": agent_id} for agent_id in dirty])
    if ready and not state["ready"]:
        logger.info("x402_rollup_bootstrap_completed")
    return bool(ids)


def advance_x402_rollup() -> None:
    deadline = monotonic() + 1.0
    for _ in range(BATCHES_PER_RUN):
        if not _apply_batch() or monotonic() >= deadline:
            break


def schedule_x402_rollup(scheduler: AsyncIOScheduler) -> None:
    if not install_x402_rollup():
        return

    async def update() -> None:
        await to_thread.run_sync(advance_x402_rollup)

    scheduler.add_job(
        update,
        trigger="interval",
        seconds=3,
        next_run_time=datetime.now(timezone.utc) + timedelta(seconds=25),
        id="x402_agent_rollup",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
