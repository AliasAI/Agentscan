"""Blockchain synchronization service - Multi-network support"""

import asyncio
import httpx
from datetime import datetime
from typing import Optional
from web3 import Web3
from sqlalchemy.orm import Session

from src.core.blockchain_config import (
    REGISTRY_ABI,
    MAX_RETRIES,
    RETRY_DELAY_SECONDS,
    REQUEST_DELAY_SECONDS,
    IPFS_GATEWAY,
)
from src.core.reputation_config import REPUTATION_REGISTRY_ABI
from src.core.networks_config import NETWORKS, get_network
from src.models import (
    Agent, BlockchainSync, SyncStatusEnum, SyncStatus,
    AgentStatus, Activity, ActivityType, Network
)
from src.db.database import SessionLocal
from src.services.ai_classifier import ai_classifier_service
import structlog

logger = structlog.get_logger()

# Default sync configuration
DEFAULT_BLOCKS_PER_BATCH = 1000
DEFAULT_MAX_BATCHES_PER_RUN = 50


class NetworkSyncService:
    """Service for synchronizing blockchain data for a specific network"""

    def __init__(self, network_key: str):
        """Initialize sync service for a specific network

        Args:
            network_key: Key from networks_config.py (e.g., 'sepolia', 'base-sepolia')
        """
        self.network_key = network_key
        self.network_config = get_network(network_key)

        if not self.network_config:
            raise ValueError(f"Network '{network_key}' not found in configuration")

        if not self.network_config.get("enabled", True):
            raise ValueError(f"Network '{network_key}' is disabled")

        # Initialize Web3 with network-specific RPC
        rpc_url = self.network_config["rpc_url"]
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))

        # Get contract addresses
        contracts = self.network_config.get("contracts", {})
        identity_address = contracts.get("identity")
        reputation_address = contracts.get("reputation")

        if not identity_address:
            raise ValueError(f"Identity contract not configured for '{network_key}'")

        # Initialize contracts
        self.contract = self.w3.eth.contract(
            address=identity_address,
            abi=REGISTRY_ABI
        )

        if reputation_address:
            self.reputation_contract = self.w3.eth.contract(
                address=reputation_address,
                abi=REPUTATION_REGISTRY_ABI
            )
        else:
            self.reputation_contract = None
            logger.warning("no_reputation_contract", network=network_key)

        # Sync configuration
        self.start_block = self.network_config.get("start_block", 0)
        self.blocks_per_batch = self.network_config.get(
            "blocks_per_batch", DEFAULT_BLOCKS_PER_BATCH
        )

        logger.info(
            "network_sync_initialized",
            network=network_key,
            chain_id=self.network_config["chain_id"],
            identity_contract=identity_address,
            reputation_contract=reputation_address,
            start_block=self.start_block
        )

    async def sync(self):
        """Main sync method with smart sync logic"""
        db = SessionLocal()
        try:
            # Get or create sync tracker
            sync_tracker = self._get_sync_tracker(db)

            # Get current block number
            current_block = self.w3.eth.block_number
            sync_tracker.current_block = current_block

            # Calculate starting point
            from_block = sync_tracker.last_block + 1

            # Smart sync: skip if no new blocks
            if from_block > current_block:
                logger.info(
                    "sync_skipped",
                    network=self.network_key,
                    reason="no_new_blocks",
                    last_synced_block=sync_tracker.last_block,
                    current_block=current_block
                )
                return

            # Update status to running
            sync_tracker.status = SyncStatusEnum.RUNNING
            db.commit()

            # Calculate total blocks to sync
            total_blocks_to_sync = current_block - from_block + 1

            logger.info(
                "sync_started",
                network=self.network_key,
                from_block=from_block,
                current_block=current_block,
                total_blocks_to_sync=total_blocks_to_sync,
                max_batches=DEFAULT_MAX_BATCHES_PER_RUN
            )

            # Loop through batches until caught up or hit limit
            batch_count = 0
            total_blocks_processed = 0

            while from_block <= current_block and batch_count < DEFAULT_MAX_BATCHES_PER_RUN:
                batch_count += 1
                to_block = min(from_block + self.blocks_per_batch - 1, current_block)
                blocks_in_batch = to_block - from_block + 1

                logger.info(
                    "batch_processing",
                    network=self.network_key,
                    batch=batch_count,
                    from_block=from_block,
                    to_block=to_block,
                    blocks=blocks_in_batch,
                    progress=f"{total_blocks_processed}/{total_blocks_to_sync}"
                )

                # Process events for this batch
                await self._process_events(db, from_block, to_block)

                # Update sync tracker after each batch
                sync_tracker.last_block = to_block
                sync_tracker.last_synced_at = datetime.utcnow()
                db.commit()

                # Update counters
                total_blocks_processed += blocks_in_batch
                from_block = to_block + 1

                # Small delay between batches to avoid overwhelming the RPC
                if from_block <= current_block and batch_count < DEFAULT_MAX_BATCHES_PER_RUN:
                    await asyncio.sleep(1)

            # Final status update
            sync_tracker.status = SyncStatusEnum.IDLE
            sync_tracker.error_message = None
            db.commit()

            # Log completion status
            if from_block > current_block:
                logger.info(
                    "sync_completed",
                    network=self.network_key,
                    status="caught_up",
                    batches_processed=batch_count,
                    total_blocks_processed=total_blocks_processed,
                    final_block=sync_tracker.last_block
                )
            else:
                remaining_blocks = current_block - sync_tracker.last_block
                logger.info(
                    "sync_completed",
                    network=self.network_key,
                    status="partial",
                    batches_processed=batch_count,
                    total_blocks_processed=total_blocks_processed,
                    final_block=sync_tracker.last_block,
                    remaining_blocks=remaining_blocks,
                    note="Will continue in next run"
                )

        except Exception as e:
            logger.error("sync_failed", network=self.network_key, error=str(e))
            if 'sync_tracker' in locals():
                sync_tracker.status = SyncStatusEnum.ERROR
                sync_tracker.error_message = str(e)[:500]
                db.commit()
        finally:
            db.close()

    async def _process_events(self, db: Session, from_block: int, to_block: int):
        """Process blockchain events with rate limiting"""

        # Get Registered events
        registered_events = self.contract.events.Registered.get_logs(
            from_block=from_block,
            to_block=to_block
        )

        logger.info(
            "events_found",
            network=self.network_key,
            event_type="Registered",
            count=len(registered_events)
        )

        for i, event in enumerate(registered_events):
            await self._process_registered_event(db, event)
            if i < len(registered_events) - 1:
                await asyncio.sleep(REQUEST_DELAY_SECONDS)

        # Get UriUpdated events
        updated_events = self.contract.events.UriUpdated.get_logs(
            from_block=from_block,
            to_block=to_block
        )

        logger.info(
            "events_found",
            network=self.network_key,
            event_type="UriUpdated",
            count=len(updated_events)
        )

        for i, event in enumerate(updated_events):
            await self._process_updated_event(db, event)
            if i < len(updated_events) - 1:
                await asyncio.sleep(REQUEST_DELAY_SECONDS)

        # Get reputation events if reputation contract is configured
        if self.reputation_contract:
            await self._process_reputation_events(db, from_block, to_block)

    async def _process_reputation_events(
        self, db: Session, from_block: int, to_block: int
    ):
        """Process reputation events (NewFeedback, FeedbackRevoked)"""
        # Get NewFeedback events
        feedback_events = self.reputation_contract.events.NewFeedback.get_logs(
            from_block=from_block,
            to_block=to_block
        )

        logger.info(
            "events_found",
            network=self.network_key,
            event_type="NewFeedback",
            count=len(feedback_events)
        )

        for i, event in enumerate(feedback_events):
            await self._process_feedback_event(db, event)
            if i < len(feedback_events) - 1:
                await asyncio.sleep(REQUEST_DELAY_SECONDS)

        # Get FeedbackRevoked events
        revoked_events = self.reputation_contract.events.FeedbackRevoked.get_logs(
            from_block=from_block,
            to_block=to_block
        )

        logger.info(
            "events_found",
            network=self.network_key,
            event_type="FeedbackRevoked",
            count=len(revoked_events)
        )

        for i, event in enumerate(revoked_events):
            await self._process_feedback_event(db, event)
            if i < len(revoked_events) - 1:
                await asyncio.sleep(REQUEST_DELAY_SECONDS)

    async def _process_registered_event(self, db: Session, event):
        """Process Registered event"""
        from sqlalchemy.exc import IntegrityError

        token_id = event['args']['agentId']
        owner = event['args']['owner']
        metadata_uri = event['args']['tokenURI']

        # Get block timestamp for accurate registration time
        block = self.w3.eth.get_block(event['blockNumber'])
        block_timestamp = datetime.fromtimestamp(block['timestamp'])

        logger.info(
            "processing_agent",
            network=self.network_key,
            agent_id=token_id,
            owner=owner,
            block_timestamp=block_timestamp
        )

        # Check if agent already exists (with network_id to allow same token_id on different networks)
        network_id = self._get_network_id(db)
        existing_agent = db.query(Agent).filter(
            Agent.token_id == token_id,
            Agent.network_id == network_id
        ).first()

        if existing_agent:
            logger.info(
                "agent_already_exists",
                network=self.network_key,
                token_id=token_id
            )
            return

        # Fetch metadata
        metadata = await self._fetch_metadata(metadata_uri)

        try:
            # Double-check before insert
            existing_agent = db.query(Agent).filter(
                Agent.token_id == token_id,
                Agent.network_id == network_id
            ).first()
            if existing_agent:
                logger.info(
                    "agent_already_exists_recheck",
                    network=self.network_key,
                    token_id=token_id
                )
                return

            # Extract or classify OASF skills and domains
            name = metadata.get('name', f'Agent #{token_id}')
            description = metadata.get('description', 'No description')
            oasf_data = await self._extract_oasf_data(metadata, name, description)

            # Create agent with blockchain timestamp
            agent = Agent(
                token_id=token_id,
                name=name,
                address=owner.lower(),
                owner_address=owner.lower(),
                description=description,
                reputation_score=0.0,
                status=AgentStatus.ACTIVE,
                network_id=network_id,
                metadata_uri=metadata_uri,
                on_chain_data=dict(event['args']),
                sync_status=SyncStatus.SYNCED,
                last_synced_at=datetime.utcnow(),
                created_at=block_timestamp,
                skills=oasf_data.get('skills'),
                domains=oasf_data.get('domains'),
                classification_source=oasf_data.get('source')
            )

            db.add(agent)
            db.commit()

            # Create activity record
            activity = Activity(
                agent_id=agent.id,
                activity_type=ActivityType.REGISTERED,
                description=f"Agent '{agent.name}' (#{token_id}) registered on {self.network_config['name']}",
                tx_hash=event['transactionHash'].hex() if 'transactionHash' in event else None,
                created_at=block_timestamp
            )
            db.add(activity)
            db.commit()

            logger.info(
                "agent_created",
                network=self.network_key,
                token_id=token_id,
                name=agent.name,
                registered_at=block_timestamp
            )

        except IntegrityError:
            db.rollback()
            logger.warning(
                "agent_insert_conflict",
                network=self.network_key,
                token_id=token_id,
                error="Concurrent insert detected, skipping"
            )

    async def _process_updated_event(self, db: Session, event):
        """Process UriUpdated event"""
        token_id = event['args']['agentId']
        metadata_uri = event['args']['newUri']

        network_id = self._get_network_id(db)
        agent = db.query(Agent).filter(
            Agent.token_id == token_id,
            Agent.network_id == network_id
        ).first()

        if not agent:
            logger.warning(
                "agent_not_found",
                network=self.network_key,
                token_id=token_id
            )
            return

        # Fetch updated metadata
        metadata = await self._fetch_metadata(metadata_uri)

        # Update agent
        name = metadata.get('name', agent.name)
        description = metadata.get('description', agent.description)
        oasf_data = await self._extract_oasf_data(metadata, name, description)

        agent.name = name
        agent.description = description
        agent.metadata_uri = metadata_uri
        agent.last_synced_at = datetime.utcnow()
        agent.sync_status = SyncStatus.SYNCED
        agent.skills = oasf_data.get('skills')
        agent.domains = oasf_data.get('domains')
        agent.classification_source = oasf_data.get('source')

        db.commit()

        logger.info(
            "agent_updated",
            network=self.network_key,
            token_id=token_id
        )

    async def _process_feedback_event(self, db: Session, event):
        """Process NewFeedback or FeedbackRevoked event"""
        token_id = event['args']['agentId']

        network_id = self._get_network_id(db)
        agent = db.query(Agent).filter(
            Agent.token_id == token_id,
            Agent.network_id == network_id
        ).first()

        if not agent:
            logger.warning(
                "agent_not_found_for_feedback",
                network=self.network_key,
                token_id=token_id
            )
            return

        try:
            # Call getSummary to get updated reputation
            count, average_score = await asyncio.to_thread(
                self.reputation_contract.functions.getSummary(
                    token_id,
                    [],
                    b'\x00' * 32,
                    b'\x00' * 32
                ).call
            )

            # Update reputation
            old_score = agent.reputation_score
            agent.reputation_score = float(average_score)
            agent.reputation_count = int(count)
            agent.reputation_last_updated = datetime.utcnow()

            db.commit()

            # Create activity record if score changed
            if old_score != float(average_score):
                activity = Activity(
                    agent_id=agent.id,
                    activity_type=ActivityType.REPUTATION_UPDATE,
                    description=f"Reputation updated: {old_score:.1f} → {average_score:.1f} ({count} reviews)",
                    tx_hash=event['transactionHash'].hex() if 'transactionHash' in event else None
                )
                db.add(activity)
                db.commit()

            logger.info(
                "reputation_updated_from_event",
                network=self.network_key,
                token_id=token_id,
                agent_name=agent.name,
                score=average_score,
                count=count,
                event_type=event['event']
            )

        except Exception as e:
            logger.warning(
                "reputation_update_from_event_failed",
                network=self.network_key,
                token_id=token_id,
                agent_name=agent.name,
                error=str(e)
            )

    async def _fetch_metadata(self, uri: str, retries: int = MAX_RETRIES) -> dict:
        """Fetch metadata from URI with retry logic"""
        import base64
        import json

        # Handle empty URI
        if not uri or uri.strip() == '':
            logger.debug("empty_metadata_uri", network=self.network_key)
            return {
                'name': 'Unknown Agent',
                'description': 'No metadata URI provided'
            }

        # Handle direct JSON string
        if uri.startswith('{'):
            try:
                metadata = json.loads(uri)
                logger.info(
                    "direct_json_parsed",
                    network=self.network_key,
                    agent_id=metadata.get('agent_id', 'Unknown')
                )
                if 'name' not in metadata and 'agent_id' in metadata:
                    metadata['name'] = metadata['agent_id']
                if 'description' not in metadata:
                    metadata['description'] = 'Agent from direct JSON'
                return metadata
            except Exception as e:
                logger.warning(
                    "direct_json_parse_failed",
                    network=self.network_key,
                    error=str(e),
                    uri=uri[:100]
                )

        # Handle data URI
        if uri.startswith('data:'):
            try:
                if 'base64,' in uri:
                    base64_data = uri.split('base64,')[1]
                    json_data = base64.b64decode(base64_data).decode('utf-8')
                    metadata = json.loads(json_data)
                    logger.info(
                        "data_uri_parsed",
                        network=self.network_key,
                        format="base64",
                        name=metadata.get('name', 'Unknown')
                    )
                    return metadata
                elif ',' in uri:
                    json_data = uri.split(',', 1)[1]
                    from urllib.parse import unquote
                    json_data = unquote(json_data)
                    metadata = json.loads(json_data)
                    logger.info(
                        "data_uri_parsed",
                        network=self.network_key,
                        format="plain",
                        name=metadata.get('name', 'Unknown')
                    )
                    return metadata
                else:
                    logger.warning(
                        "unsupported_data_uri_format",
                        network=self.network_key,
                        uri=uri[:100]
                    )
            except Exception as e:
                logger.warning(
                    "data_uri_parse_failed",
                    network=self.network_key,
                    error=str(e),
                    uri=uri[:100]
                )
                return {
                    'name': 'Unknown Agent',
                    'description': 'Data URI parse failed'
                }

        # Handle IPFS URI
        if uri.startswith('ipfs://'):
            url = f"{IPFS_GATEWAY}{uri[7:]}"
        else:
            url = uri

        # Fetch from HTTP/HTTPS URL
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    return response.json()
            except Exception as e:
                logger.warning(
                    "metadata_fetch_failed",
                    network=self.network_key,
                    url=url,
                    attempt=attempt + 1,
                    error=str(e)
                )
                if attempt < retries - 1:
                    await asyncio.sleep(RETRY_DELAY_SECONDS)

        return {
            'name': 'Unknown Agent',
            'description': 'Metadata fetch failed'
        }

    def _is_valid_description(self, description: str) -> bool:
        """Check if description is valid for AI classification"""
        if not description or not isinstance(description, str):
            return False

        description = description.strip()

        MIN_DESCRIPTION_LENGTH = 20
        if len(description) < MIN_DESCRIPTION_LENGTH:
            return False

        invalid_patterns = [
            'no metadata', 'metadata fetch failed', 'no description',
            'unknown agent', 'agent from direct json', 'no metadata uri provided',
            'failed to fetch', 'error fetching', 'not available', 'n/a',
            'test agent', 'created at', 'updated', 'lorem ipsum',
            'todo', 'placeholder', 'example', 'demo agent',
        ]

        description_lower = description.lower()
        for pattern in invalid_patterns:
            if pattern in description_lower:
                return False

        digit_count = sum(c.isdigit() for c in description)
        if digit_count / len(description) > 0.5:
            return False

        return True

    async def _extract_oasf_data(
        self, metadata: dict, name: str, description: str
    ) -> dict:
        """Extract or auto-classify OASF skills and domains"""
        skills = []
        domains = []

        # Try to extract from metadata endpoints
        if 'endpoints' in metadata and isinstance(metadata['endpoints'], list):
            for endpoint in metadata['endpoints']:
                if isinstance(endpoint, dict):
                    if 'skills' in endpoint and isinstance(endpoint['skills'], list):
                        skills.extend(endpoint['skills'])
                    if 'domains' in endpoint and isinstance(endpoint['domains'], list):
                        domains.extend(endpoint['domains'])

        if skills or domains:
            logger.info(
                "oasf_extracted_from_metadata",
                network=self.network_key,
                name=name,
                skills_count=len(skills),
                domains_count=len(domains)
            )
            return {
                "skills": list(set(skills))[:5],
                "domains": list(set(domains))[:3],
                "source": "metadata"
            }

        # Use AI classification if description is valid
        if not self._is_valid_description(description):
            logger.info(
                "oasf_classification_skipped",
                network=self.network_key,
                name=name,
                reason="insufficient_description",
                description_preview=description[:50] if description else None
            )
            return {"skills": [], "domains": [], "source": None}

        try:
            classification = await ai_classifier_service.classify_agent(
                name, description
            )
            logger.info(
                "oasf_auto_classified",
                network=self.network_key,
                name=name,
                skills_count=len(classification.get('skills', [])),
                domains_count=len(classification.get('domains', []))
            )
            classification["source"] = "ai"
            return classification
        except Exception as e:
            logger.warning(
                "oasf_classification_failed",
                network=self.network_key,
                name=name,
                error=str(e)
            )
            return {"skills": [], "domains": [], "source": None}

    def _get_sync_tracker(self, db: Session) -> BlockchainSync:
        """Get or create blockchain sync tracker for this network"""
        contracts = self.network_config.get("contracts", {})
        identity_address = contracts.get("identity", "")

        sync = db.query(BlockchainSync).filter(
            BlockchainSync.network_name == self.network_key
        ).first()

        if not sync:
            sync = BlockchainSync(
                network_name=self.network_key,
                contract_address=identity_address,
                last_block=self.start_block - 1,
                status=SyncStatusEnum.IDLE
            )
            db.add(sync)
            db.commit()

        return sync

    def _get_network_id(self, db: Session) -> str:
        """Get network ID from database"""
        network = db.query(Network).filter(
            Network.chain_id == self.network_config["chain_id"]
        ).first()

        if network:
            return network.id

        # Create if not exists
        network = Network(
            name=self.network_config["name"],
            chain_id=self.network_config["chain_id"],
            rpc_url=self.network_config["rpc_url"],
            explorer_url=self.network_config["explorer_url"],
            contracts=self.network_config.get("contracts")
        )
        db.add(network)
        db.commit()
        return network.id


# Global instances for each enabled network
_sync_services: dict[str, NetworkSyncService] = {}


def get_sync_service(network_key: str) -> NetworkSyncService:
    """Get or create sync service for a network"""
    if network_key not in _sync_services:
        _sync_services[network_key] = NetworkSyncService(network_key)
    return _sync_services[network_key]


# Backward compatibility: default Sepolia sync service
blockchain_sync_service = get_sync_service("sepolia")


# Convenience functions for scheduler
async def sync_sepolia():
    """Sync Sepolia network"""
    service = get_sync_service("sepolia")
    await service.sync()


async def sync_base_sepolia():
    """Sync Base Sepolia network"""
    service = get_sync_service("base-sepolia")
    await service.sync()


async def sync_all_networks():
    """Sync all enabled networks sequentially"""
    for network_key, config in NETWORKS.items():
        if config.get("enabled", True):
            try:
                service = get_sync_service(network_key)
                await service.sync()
            except Exception as e:
                logger.error(
                    "network_sync_failed",
                    network=network_key,
                    error=str(e)
                )
