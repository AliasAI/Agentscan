#!/usr/bin/env python3
"""检查分类详情"""
from src.db.database import SessionLocal
from src.models.agent import Agent

db = SessionLocal()

# 总数
total = db.query(Agent).count()
print(f'总 agents 数量: {total}')

# 有 skills 的
with_skills = db.query(Agent).filter(
    Agent.skills.isnot(None), Agent.skills != '[]'
).count()
print(f'有 skills 的 agents: {with_skills}')

# 有 domains 的
with_domains = db.query(Agent).filter(
    Agent.domains.isnot(None), Agent.domains != '[]'
).count()
print(f'有 domains 的 agents: {with_domains}')

# 两者都有的
both = db.query(Agent).filter(
    Agent.skills.isnot(None), Agent.skills != '[]',
    Agent.domains.isnot(None), Agent.domains != '[]'
).count()
print(f'两者都有的 agents: {both}')

# 至少有一个的
from sqlalchemy import or_
either = db.query(Agent).filter(
    or_(
        (Agent.skills.isnot(None)) & (Agent.skills != '[]'),
        (Agent.domains.isnot(None)) & (Agent.domains != '[]')
    )
).count()
print(f'至少有一个的 agents: {either}')

# 完全未分类的
unclassified = db.query(Agent).filter(
    or_(
        Agent.skills.is_(None),
        Agent.skills == '[]'
    )
).count()
print(f'未分类 agents (无 skills): {unclassified}')

db.close()
