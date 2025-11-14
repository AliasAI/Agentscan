from src.db.database import SessionLocal
from src.models.agent import Agent
from sqlalchemy import func

with SessionLocal() as db:
    total = db.query(func.count(Agent.id)).scalar()
    classified = db.query(func.count(Agent.id)).filter(
        (Agent.skills != None) & (Agent.skills != "[]")
    ).scalar()
    unclassified = total - classified

    print(f"📊 数据库统计:")
    print(f"  总 Agents: {total}")
    print(f"  ✅ 已分类: {classified}")
    print(f"  ❌ 未分类: {unclassified}")
    print(f"  进度: {classified/total*100:.2f}%")
    print()

    # 显示刚刚分类的 agents
    print(f"最新分类的 5 个 Agents:")
    agents = db.query(Agent).filter(
        (Agent.skills != None) & (Agent.skills != "[]")
    ).order_by(Agent.id.desc()).limit(5).all()

    for agent in agents:
        print(f"  - {agent.name}")
        print(f"    Skills: {len(agent.skills)} | Domains: {len(agent.domains)}")
        if agent.skills:
            print(f"    {agent.skills[:2]}")
