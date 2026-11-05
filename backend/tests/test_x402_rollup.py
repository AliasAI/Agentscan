"""Exercise durable x402 bootstrap and write-triggered updates with SQLite."""

from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from src.db.database import Base
from src.models import Agent, AgentCapability
from src.services.rollups import x402
from src.services.x402_agent_signals import read_local_x402_snapshot


class X402RollupTests(TestCase):
    def setUp(self):
        temp = TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        engine = create_engine(f"sqlite:///{temp.name}/test.db")
        self.addCleanup(engine.dispose)
        Base.metadata.create_all(engine)
        self.sessions = sessionmaker(bind=engine)
        patches = patch.multiple(x402, engine=engine, SessionLocal=self.sessions, BATCH_SIZE=2)
        patches.start()
        self.addCleanup(patches.stop)

    def _counts(self):
        with self.sessions() as db:
            result = read_local_x402_snapshot(db)
            return tuple(result[f"{key}_capability_agents"] for key in ("x402", "agentkit", "payable"))

    def _agent(self, agent_id, description="", metadata_uri=None):
        return Agent(
            id=agent_id, address="0x01", name=agent_id, description=description,
            network_id="base", metadata_uri=metadata_uri,
        )

    def test_bootstrap_resumes_and_future_writes_only_touch_changed_agents(self):
        with self.sessions.begin() as db:
            db.add_all([
                self._agent("a", metadata_uri='{"x402Support":true}'),
                self._agent("b", description="AgentKit micropayments"),
                self._agent("c"),
                AgentCapability(agent_id="b", capability_name="x402", source="test"),
                AgentCapability(agent_id="orphan", capability_name="payable", source="test"),
            ])
        self.assertTrue(x402.install_x402_rollup())
        self.assertTrue(x402._apply_batch())
        with self.sessions() as db:
            self.assertEqual(db.execute(text("SELECT cursor FROM x402_rollup_state")).scalar_one(), "b")
        self.assertTrue(x402.install_x402_rollup())
        with self.sessions.begin() as db:
            # This ID falls behind the existing cursor and must be handled by its insert event.
            db.add(self._agent("0", description="agentkit"))
        x402.advance_x402_rollup()
        self.assertEqual(self._counts(), (2, 2, 3))

        with self.sessions.begin() as db:
            db.get(Agent, "a").metadata_uri = None
            db.get(Agent, "c").endpoint_status = {"has_working_endpoints": True}
            db.query(AgentCapability).filter_by(agent_id="b", capability_name="x402").delete()
        with self.sessions() as db:
            changed = db.execute(text("SELECT agent_id FROM x402_rollup_dirty ORDER BY agent_id")).scalars().all()
        self.assertEqual(changed, ["a", "b"])
        x402.advance_x402_rollup()
        self.assertEqual(self._counts(), (0, 2, 2))

        with self.sessions.begin() as db:
            db.delete(db.get(Agent, "b"))
        x402.advance_x402_rollup()
        self.assertEqual(self._counts(), (0, 1, 1))

    def test_failed_batch_leaves_change_pending(self):
        x402.install_x402_rollup()
        x402.advance_x402_rollup()
        with self.sessions.begin() as db:
            db.add(self._agent("new", description="x402"))
        with patch.object(x402, "x402_signal_mask", side_effect=RuntimeError("parse failed")):
            with self.assertRaisesRegex(RuntimeError, "parse failed"):
                x402._apply_batch()
        self.assertEqual(self._counts(), (0, 0, 0))
        x402.advance_x402_rollup()
        self.assertEqual(self._counts(), (1, 0, 0))
