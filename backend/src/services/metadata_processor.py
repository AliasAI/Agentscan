"""Metadata processing — OASF extraction, validation, and on-demand refresh"""

from datetime import datetime

from sqlalchemy.orm import Session

import structlog

from src.services.ai_classifier import ai_classifier_service
from src.services.metadata_service import metadata_service
from src.taxonomies.oasf_taxonomy import OASF_SKILLS, OASF_DOMAINS

logger = structlog.get_logger()

# Minimum description length for AI classification
MIN_DESCRIPTION_LENGTH = 20

# Patterns indicating invalid/placeholder descriptions
INVALID_DESCRIPTION_PATTERNS = [
    "no metadata", "metadata fetch failed", "no description",
    "unknown agent", "agent from direct json", "no metadata uri provided",
    "failed to fetch", "error fetching", "not available", "n/a",
    "test agent", "created at", "updated", "lorem ipsum",
    "todo", "placeholder", "example", "demo agent",
]


def is_valid_description(description: str) -> bool:
    """Check if description is valid for AI classification"""
    if not description or not isinstance(description, str):
        return False

    description = description.strip()

    if len(description) < MIN_DESCRIPTION_LENGTH:
        return False

    description_lower = description.lower()
    for pattern in INVALID_DESCRIPTION_PATTERNS:
        if pattern in description_lower:
            return False

    digit_count = sum(c.isdigit() for c in description)
    if digit_count / len(description) > 0.5:
        return False

    return True


async def extract_oasf_data(
    metadata: dict, name: str, description: str,
    network_key: str = "",
) -> dict:
    """Extract or auto-classify OASF skills and domains.

    Returns dict with keys: skills, domains, source
    """
    raw_skills: list[str] = []
    raw_domains: list[str] = []

    # Try to extract from metadata services (Jan 2026 mainnet format)
    # Also check endpoints for backward compatibility
    services_list = metadata.get("services") or metadata.get("endpoints") or []
    if isinstance(services_list, list):
        for service in services_list:
            if isinstance(service, dict):
                if "skills" in service and isinstance(service["skills"], list):
                    raw_skills.extend(service["skills"])
                if "domains" in service and isinstance(service["domains"], list):
                    raw_domains.extend(service["domains"])

    # Validate against OASF standard
    valid_skills = [s for s in raw_skills if s in OASF_SKILLS]
    valid_domains = [d for d in raw_domains if d in OASF_DOMAINS]

    # Log invalid entries for debugging
    invalid_skills = [s for s in raw_skills if s not in OASF_SKILLS]
    invalid_domains = [d for d in raw_domains if d not in OASF_DOMAINS]
    if invalid_skills or invalid_domains:
        logger.debug(
            "oasf_invalid_entries_filtered",
            network=network_key,
            name=name,
            invalid_skills=invalid_skills[:3],
            invalid_domains=invalid_domains[:3],
        )

    # Use metadata-extracted values if valid
    if valid_skills or valid_domains:
        logger.info(
            "oasf_extracted_from_services",
            network=network_key,
            name=name,
            skills_count=len(valid_skills),
            domains_count=len(valid_domains),
        )
        return {
            "skills": list(set(valid_skills))[:5],
            "domains": list(set(valid_domains))[:3],
            "source": "metadata",
        }

    # Use AI classification if description is valid
    if not is_valid_description(description):
        logger.info(
            "oasf_classification_skipped",
            network=network_key,
            name=name,
            reason="insufficient_description",
            description_preview=description[:50] if description else None,
        )
        return {"skills": [], "domains": [], "source": None}

    try:
        classification = await ai_classifier_service.classify_agent(name, description)
        logger.info(
            "oasf_auto_classified",
            network=network_key,
            name=name,
            skills_count=len(classification.get("skills", [])),
            domains_count=len(classification.get("domains", [])),
        )
        classification["source"] = "ai"
        return classification
    except Exception as e:
        logger.warning(
            "oasf_classification_failed",
            network=network_key,
            name=name,
            error=str(e),
        )
        return {"skills": [], "domains": [], "source": None}


async def refresh_agent_metadata(db: Session, agent) -> bool:
    """Refresh agent metadata on demand (called from API detail endpoint).

    Fetches latest metadata from URI, updates active status and OASF fields.
    Returns True if refresh succeeded, False otherwise.
    """
    if not agent.metadata_uri:
        return False

    try:
        # Bypass cache — we want fresh data for on-demand refresh
        result = await metadata_service.fetch_and_parse(
            agent.metadata_uri, timeout=10.0, retries=1, use_cache=False,
        )

        if not result["success"] or not result["metadata"]:
            logger.warning(
                "metadata_refresh_fetch_failed",
                agent_id=agent.id,
                error=result.get("error"),
            )
            # Still update timestamp so we don't retry too frequently
            agent.metadata_refreshed_at = datetime.utcnow()
            db.commit()
            return False

        metadata = result["metadata"]

        # Update basic fields
        agent.name = metadata.get("name", agent.name)
        agent.description = metadata.get("description", agent.description)

        # Extract active field (ERC-8004 链下字段)
        active_value = metadata.get("active")
        if active_value is not None:
            agent.is_active = bool(active_value)

        # Re-extract OASF data
        oasf_data = await extract_oasf_data(
            metadata, agent.name, agent.description
        )
        agent.skills = oasf_data.get("skills") or agent.skills
        agent.domains = oasf_data.get("domains") or agent.domains
        if oasf_data.get("source"):
            agent.classification_source = oasf_data["source"]

        agent.metadata_refreshed_at = datetime.utcnow()
        db.commit()

        logger.info(
            "metadata_refreshed",
            agent_id=agent.id,
            agent_name=agent.name,
            is_active=agent.is_active,
        )
        return True

    except Exception as e:
        logger.warning(
            "metadata_refresh_error",
            agent_id=agent.id,
            error=str(e),
        )
        return False
