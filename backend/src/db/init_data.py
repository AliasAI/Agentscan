"""Initialize test data"""

import random
from datetime import datetime, timedelta

from src.db.database import SessionLocal, engine, Base
from src.models import Agent, Network, Activity, AgentStatus, ActivityType


def init_db():
    """Initialize database and test data"""

    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if database already has data
        if db.query(Network).first():
            print("Database already initialized, skipping")
            return

        # Create networks
        networks = [
            Network(
                name="Ethereum Mainnet",
                chain_id=1,
                rpc_url="https://eth.llamarpc.com",
                explorer_url="https://etherscan.io",
            ),
            Network(
                name="Polygon",
                chain_id=137,
                rpc_url="https://polygon-rpc.com",
                explorer_url="https://polygonscan.com",
            ),
            Network(
                name="Arbitrum",
                chain_id=42161,
                rpc_url="https://arb1.arbitrum.io/rpc",
                explorer_url="https://arbiscan.io",
            ),
        ]
        db.add_all(networks)
        db.commit()

        # Create agents
        agent_names = [
            "DeFi Trading Bot",
            "NFT Analyzer",
            "Data Oracle",
            "Smart Contract Auditor",
            "Yield Optimizer",
            "Price Predictor",
            "Risk Assessor",
        ]

        agents = []
        for i, name in enumerate(agent_names):
            agent = Agent(
                name=name,
                address=f"0x{random.randint(0, 16**40):040x}",
                description=f"An intelligent agent specializing in {name}",
                reputation_score=random.uniform(75, 100),
                status=random.choice(list(AgentStatus)),
                network_id=random.choice(networks).id,
            )
            agents.append(agent)
        db.add_all(agents)
        db.commit()

        # Create activity records
        activities = []
        for agent in agents:
            for _ in range(random.randint(3, 8)):
                activity = Activity(
                    agent_id=agent.id,
                    activity_type=random.choice(list(ActivityType)),
                    description=f"Activity record for {agent.name}",
                    tx_hash=f"0x{random.randint(0, 16**64):064x}"
                    if random.random() > 0.3
                    else None,
                    created_at=datetime.utcnow()
                    - timedelta(hours=random.randint(1, 720)),
                )
                activities.append(activity)
        db.add_all(activities)
        db.commit()

        print("Test data initialization successful!")
        print(f"Created {len(networks)} networks")
        print(f"Created {len(agents)} agents")
        print(f"Created {len(activities)} activity records")

    finally:
        db.close()


if __name__ == "__main__":
    init_db()
