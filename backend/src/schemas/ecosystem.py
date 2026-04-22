"""Ecosystem API schemas."""

from pydantic import BaseModel


class EcosystemSummaryItem(BaseModel):
    ecosystem: str
    agent_count: int
    capability_count: int


class EcosystemSummaryResponse(BaseModel):
    items: list[EcosystemSummaryItem]
