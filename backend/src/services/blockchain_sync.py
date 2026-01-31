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
    AgentStatus, Activity, ActivityType, Network, Feedback, Validation
)
from src.db.database import SessionLocal
from src.services.ai_classifier import ai_classifier_service
from src.taxonomies.oasf_taxonomy import OASF_SKILLS, OASF_DOMAINS
import structlog
from eth_abi import decode

logger = structlog.get_logger()

# Default sync configuration
DEFAULT_BLOCKS_PER_BATCH = 1000
DEFAULT_MAX_BATCHES_PER_RUN = 50

# NewFeedback event topic (Jan 2026 mainnet freeze)
# NewFeedback(uint256,address,uint64,int128,uint8,string,string,string,string,string,bytes32)
# Note: has indexedTag1 (string indexed) AND tag1 (string) = 2 string params for tag1
NEWFEEDBACK_TOPIC = "0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc"

# Validation event topics
# ValidationRequest(address indexed validatorAddress, uint256 indexed agentId, string requestUri, bytes32 indexed requestHash)
VALIDATION_REQUEST_TOPIC = Web3.keccak(text="ValidationRequest(address,uint256,string,bytes32)").hex()
# ValidationResponse(address indexed validatorAddress, uint256 indexed agentId, bytes32 indexed requestHash, uint8 response, string responseUri, bytes32 tag)
VALIDATION_RESPONSE_TOPIC = Web3.keccak(text="ValidationResponse(address,uint256,bytes32,uint8,string,bytes32)").hex()


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

        # Inject POA middleware for chains like BSC that use Proof of Authority
        # This handles the extraData field that exceeds 32 bytes in POA chains
        from web3.middleware import ExtraDataToPOAMiddleware
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

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

        # Get URIUpdated events (renamed from UriUpdated in Jan 2026 update)
        updated_events = self.contract.events.URIUpdated.get_logs(
            from_block=from_block,
            to_block=to_block
        )

        logger.info(
            "events_found",
            network=self.network_key,
            event_type="URIUpdated",
            count=len(updated_events)
        )

        for i, event in enumerate(updated_events):
            await self._process_updated_event(db, event)
            if i < len(updated_events) - 1:
                await asyncio.sleep(REQUEST_DELAY_SECONDS)

        # Get reputation events if reputation contract is configured
        if self.reputation_contract:
            await self._process_reputation_events(db, from_block, to_block)

        # Get validation events if validation contract is configured
        validation_address = self.network_config.get("contracts", {}).get("validation")
        if validation_address:
            await self._process_validation_events(db, from_block, to_block)

    async def _process_reputation_events(
        self, db: Session, from_block: int, to_block: int
    ):
        """Process reputation events using raw log parsing.

        Uses raw eth_getLogs instead of ABI-based event parsing to handle
        signature mismatches between our ABI and the actual on-chain contract.
        """
        reputation_address = self.network_config.get("contracts", {}).get("reputation")
        if not reputation_address:
            return

        # Get NewFeedback events using raw logs
        try:
            logs = await asyncio.to_thread(
                self.w3.eth.get_logs,
                {
                    "address": reputation_address,
                    "fromBlock": from_block,
                    "toBlock": to_block,
                    "topics": [NEWFEEDBACK_TOPIC]
                }
            )

            logger.info(
                "events_found",
                network=self.network_key,
                event_type="NewFeedback",
                count=len(logs)
            )

            for i, log in enumerate(logs):
                await self._process_raw_feedback_log(db, log)
                if i < len(logs) - 1:
                    await asyncio.sleep(REQUEST_DELAY_SECONDS)

        except Exception as e:
            logger.warning(
                "feedback_events_query_failed",
                network=self.network_key,
                from_block=from_block,
                to_block=to_block,
                error=str(e)
            )

    async def _process_validation_events(
        self, db: Session, from_block: int, to_block: int
    ):
        """Process validation events (ValidationRequest and ValidationResponse)."""
        validation_address = self.network_config.get("contracts", {}).get("validation")
        if not validation_address:
            return

        # Process ValidationRequest events
        try:
            request_logs = await asyncio.to_thread(
                self.w3.eth.get_logs,
                {
                    "address": validation_address,
                    "fromBlock": from_block,
                    "toBlock": to_block,
                    "topics": [VALIDATION_REQUEST_TOPIC]
                }
            )

            logger.info(
                "events_found",
                network=self.network_key,
                event_type="ValidationRequest",
                count=len(request_logs)
            )

            for log in request_logs:
                await self._process_validation_request_log(db, log)

        except Exception as e:
            logger.warning(
                "validation_request_events_query_failed",
                network=self.network_key,
                from_block=from_block,
                to_block=to_block,
                error=str(e)
            )

        # Process ValidationResponse events
        try:
            response_logs = await asyncio.to_thread(
                self.w3.eth.get_logs,
                {
                    "address": validation_address,
                    "fromBlock": from_block,
                    "toBlock": to_block,
                    "topics": [VALIDATION_RESPONSE_TOPIC]
                }
            )

            logger.info(
                "events_found",
                network=self.network_key,
                event_type="ValidationResponse",
                count=len(response_logs)
            )

            for log in response_logs:
                await self._process_validation_response_log(db, log)

        except Exception as e:
            logger.warning(
                "validation_response_events_query_failed",
                network=self.network_key,
                from_block=from_block,
                to_block=to_block,
                error=str(e)
            )

    async def _process_validation_request_log(self, db: Session, log: dict):
        """Process ValidationRequest log and save to database."""
        try:
            # Parse indexed topics
            # topics[0] = event sig, topics[1] = validatorAddress, topics[2] = agentId, topics[3] = requestHash
            validator_address = "0x" + log["topics"][1].hex()[-40:]
            agent_id = int(log["topics"][2].hex(), 16)
            request_hash = "0x" + log["topics"][3].hex()

            # Decode non-indexed data: (string requestUri)
            data = bytes(log["data"])
            decoded = decode(["string"], data)
            request_uri = decoded[0]

            # Get network ID and find agent
            network_id = self._get_network_id(db)
            agent = db.query(Agent).filter(
                Agent.token_id == agent_id,
                Agent.network_id == network_id
            ).first()

            if not agent:
                logger.debug(
                    "agent_not_found_for_validation",
                    network=self.network_key,
                    token_id=agent_id
                )
                return

            # Check if validation already exists
            existing = db.query(Validation).filter(
                Validation.network_id == network_id,
                Validation.request_hash == request_hash
            ).first()

            if existing:
                return  # Already cached

            # Get block timestamp
            block = await asyncio.to_thread(
                self.w3.eth.get_block, log["blockNumber"]
            )
            block_timestamp = datetime.fromtimestamp(block["timestamp"])

            # Create validation record
            validation = Validation(
                agent_id=agent.id,
                network_id=network_id,
                token_id=agent_id,
                request_hash=request_hash,
                validator_address=validator_address.lower(),
                request_uri=request_uri if request_uri else None,
                request_block=log["blockNumber"],
                request_tx_hash=log["transactionHash"].hex(),
                requested_at=block_timestamp,
                status="PENDING"
            )
            db.add(validation)
            db.commit()

            logger.info(
                "validation_request_cached",
                network=self.network_key,
                token_id=agent_id,
                request_hash=request_hash[:18] + "..."
            )

        except Exception as e:
            logger.error(
                "process_validation_request_failed",
                network=self.network_key,
                error=str(e)
            )

    async def _process_validation_response_log(self, db: Session, log: dict):
        """Process ValidationResponse log and update existing validation record."""
        try:
            # Parse indexed topics
            # topics[0] = event sig, topics[1] = validatorAddress, topics[2] = agentId, topics[3] = requestHash
            request_hash = "0x" + log["topics"][3].hex()

            # Decode non-indexed data: (uint8 response, string responseUri, bytes32 tag)
            data = bytes(log["data"])
            decoded = decode(["uint8", "string", "bytes32"], data)
            response_score = decoded[0]
            response_uri = decoded[1]
            tag_bytes = decoded[2]

            # Convert tag bytes32 to string
            tag = None
            if tag_bytes and any(b != 0 for b in tag_bytes):
                tag = tag_bytes.rstrip(b'\x00').decode('utf-8', errors='ignore')

            # Find existing validation
            network_id = self._get_network_id(db)
            validation = db.query(Validation).filter(
                Validation.network_id == network_id,
                Validation.request_hash == request_hash
            ).first()

            if not validation:
                logger.debug(
                    "validation_not_found_for_response",
                    network=self.network_key,
                    request_hash=request_hash[:18] + "..."
                )
                return

            if validation.status == "COMPLETED":
                return  # Already completed

            # Get block timestamp
            block = await asyncio.to_thread(
                self.w3.eth.get_block, log["blockNumber"]
            )
            block_timestamp = datetime.fromtimestamp(block["timestamp"])

            # Update validation with response
            validation.response_score = response_score
            validation.response_uri = response_uri if response_uri else None
            validation.response_tag = tag
            validation.response_block = log["blockNumber"]
            validation.response_tx_hash = log["transactionHash"].hex()
            validation.completed_at = block_timestamp
            validation.status = "COMPLETED"
            db.commit()

            logger.info(
                "validation_response_cached",
                network=self.network_key,
                request_hash=request_hash[:18] + "...",
                response_score=response_score
            )

        except Exception as e:
            logger.error(
                "process_validation_response_failed",
                network=self.network_key,
                error=str(e)
            )

    async def _process_registered_event(self, db: Session, event):
        """Process Registered event"""
        from sqlalchemy.exc import IntegrityError

        token_id = event['args']['agentId']
        owner = event['args']['owner']
        metadata_uri = event['args']['agentURI']  # renamed from tokenURI in Jan 2026 update

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
        """Process URIUpdated event (renamed from UriUpdated in Jan 2026 update)"""
        token_id = event['args']['agentId']
        metadata_uri = event['args']['newURI']  # renamed from newUri in Jan 2026 update

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

    async def _process_raw_feedback_log(self, db: Session, log: dict):
        """Process raw NewFeedback log and save to database.

        Parses the raw log data and:
        1. Saves Feedback record to database for caching
        2. Updates Agent's reputation_score and reputation_count

        Updated Jan 27, 2026: ERC-8004 mainnet freeze
        - score (uint8) → value (int128) + valueDecimals (uint8)
        """
        try:
            # Parse indexed topics
            agent_id = int(log["topics"][1].hex(), 16)
            client_address = "0x" + log["topics"][2].hex()[-40:]

            # Decode non-indexed data (Jan 2026: value/valueDecimals instead of score)
            data = bytes(log["data"])
            decoded = decode(
                ["uint64", "int128", "uint8", "string", "string", "string", "string", "bytes32"],
                data
            )
            feedback_index = decoded[0]
            value = decoded[1]  # int128: supports negative and large values
            value_decimals = decoded[2]  # uint8: 0-18 decimal places
            tag1 = decoded[3]
            tag2 = decoded[4]
            endpoint = decoded[5]
            feedback_uri = decoded[6]
            feedback_hash = "0x" + decoded[7].hex()

            # Get network ID and find agent
            network_id = self._get_network_id(db)
            agent = db.query(Agent).filter(
                Agent.token_id == agent_id,
                Agent.network_id == network_id
            ).first()

            if not agent:
                logger.warning(
                    "agent_not_found_for_feedback",
                    network=self.network_key,
                    token_id=agent_id
                )
                return

            # Check if feedback already exists
            existing = db.query(Feedback).filter(
                Feedback.network_id == network_id,
                Feedback.token_id == agent_id,
                Feedback.client_address == client_address.lower(),
                Feedback.feedback_index == feedback_index
            ).first()

            if existing:
                logger.debug(
                    "feedback_already_cached",
                    network=self.network_key,
                    token_id=agent_id,
                    feedback_index=feedback_index
                )
                return

            # Get block timestamp
            block = await asyncio.to_thread(
                self.w3.eth.get_block, log["blockNumber"]
            )
            block_timestamp = datetime.fromtimestamp(block["timestamp"])

            # Create feedback record (Jan 2026: value/value_decimals)
            feedback = Feedback(
                agent_id=agent.id,
                network_id=network_id,
                token_id=agent_id,
                feedback_index=feedback_index,
                client_address=client_address.lower(),
                value=value,
                value_decimals=value_decimals,
                tag1=tag1 if tag1 else None,
                tag2=tag2 if tag2 else None,
                endpoint=endpoint if endpoint else None,
                feedback_uri=feedback_uri if feedback_uri else None,
                feedback_hash=feedback_hash if feedback_hash != "0x" + "00" * 32 else None,
                is_revoked=False,
                block_number=log["blockNumber"],
                transaction_hash=log["transactionHash"].hex(),
                timestamp=block_timestamp
            )
            db.add(feedback)

            # Update agent reputation from on-chain
            await self._update_agent_reputation(db, agent)

            db.commit()

            logger.info(
                "feedback_cached",
                network=self.network_key,
                token_id=agent_id,
                agent_name=agent.name,
                value=value,
                value_decimals=value_decimals,
                tag1=tag1,
                feedback_index=feedback_index,
                client=client_address[:10] + "..."
            )

        except Exception as e:
            logger.error(
                "process_raw_feedback_failed",
                network=self.network_key,
                error=str(e),
                log_tx=log.get("transactionHash", b"").hex() if log.get("transactionHash") else None
            )

    async def _update_agent_reputation(self, db: Session, agent: Agent):
        """Update agent's reputation from on-chain getSummary call

        Jan 27, 2026 mainnet freeze:
        - getSummary now returns (count, averageValue, valueDecimals)
        - clientAddresses MUST NOT be empty (use getClients first)
        """
        if not self.reputation_contract:
            return

        try:
            # First get all clients (required for getSummary in mainnet freeze)
            clients = await asyncio.to_thread(
                self.reputation_contract.functions.getClients(agent.token_id).call
            )

            if not clients:
                # No clients = no feedback, skip update
                return

            # Call getSummary with actual clients (not empty array)
            count, average_value, value_decimals = await asyncio.to_thread(
                self.reputation_contract.functions.getSummary(
                    agent.token_id,
                    clients,  # Actual clients list (required)
                    "",   # tag1 = empty string (no filter)
                    ""    # tag2 = empty string (no filter)
                ).call
            )

            old_score = agent.reputation_score
            # Convert value with decimals to float
            actual_value = average_value / (10 ** value_decimals) if value_decimals else average_value
            agent.reputation_score = float(actual_value)
            agent.reputation_count = int(count)
            agent.reputation_last_updated = datetime.utcnow()

            # Create activity record if score changed significantly
            if abs((old_score or 0) - float(actual_value)) >= 0.1:
                activity = Activity(
                    agent_id=agent.id,
                    activity_type=ActivityType.REPUTATION_UPDATE,
                    description=f"Reputation updated: {old_score or 0:.1f} → {actual_value:.1f} ({count} reviews)"
                )
                db.add(activity)

        except Exception as e:
            logger.warning(
                "update_agent_reputation_failed",
                network=self.network_key,
                token_id=agent.token_id,
                error=str(e)
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
            # First get all clients (required for getSummary in mainnet freeze)
            clients = await asyncio.to_thread(
                self.reputation_contract.functions.getClients(token_id).call
            )

            if not clients:
                logger.debug(
                    "no_clients_for_feedback_event",
                    network=self.network_key,
                    token_id=token_id
                )
                return

            # Call getSummary with actual clients (not empty array)
            # Jan 2026 mainnet freeze: clientAddresses required
            count, average_value, value_decimals = await asyncio.to_thread(
                self.reputation_contract.functions.getSummary(
                    token_id,
                    clients,  # Actual clients list (required)
                    "",   # tag1 = empty string (no filter)
                    ""    # tag2 = empty string (no filter)
                ).call
            )

            # Update reputation
            old_score = agent.reputation_score
            actual_value = average_value / (10 ** value_decimals) if value_decimals else average_value
            agent.reputation_score = float(actual_value)
            agent.reputation_count = int(count)
            agent.reputation_last_updated = datetime.utcnow()

            db.commit()

            # Create activity record if score changed
            if old_score != float(actual_value):
                activity = Activity(
                    agent_id=agent.id,
                    activity_type=ActivityType.REPUTATION_UPDATE,
                    description=f"Reputation updated: {old_score:.1f} → {actual_value:.1f} ({count} reviews)",
                    tx_hash=event['transactionHash'].hex() if 'transactionHash' in event else None
                )
                db.add(activity)
                db.commit()

            logger.info(
                "reputation_updated_from_event",
                network=self.network_key,
                token_id=token_id,
                agent_name=agent.name,
                value=average_value,
                value_decimals=value_decimals,
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

        # Handle direct JSON string (object or array)
        if uri.startswith('{') or uri.startswith('['):
            try:
                metadata = json.loads(uri)
                # Handle list case
                if isinstance(metadata, list):
                    logger.warning(
                        "direct_json_is_list",
                        network=self.network_key,
                        list_length=len(metadata)
                    )
                    if len(metadata) > 0 and isinstance(metadata[0], dict):
                        metadata = metadata[0]
                    else:
                        return {
                            'name': 'Unknown Agent',
                            'description': 'Direct JSON is a list',
                            'raw_data': metadata
                        }
                if not isinstance(metadata, dict):
                    return {
                        'name': 'Unknown Agent',
                        'description': f'Direct JSON has unexpected type: {type(metadata).__name__}'
                    }
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
                elif ',' in uri:
                    json_data = uri.split(',', 1)[1]
                    from urllib.parse import unquote
                    json_data = unquote(json_data)
                    metadata = json.loads(json_data)
                else:
                    logger.warning(
                        "unsupported_data_uri_format",
                        network=self.network_key,
                        uri=uri[:100]
                    )
                    return {
                        'name': 'Unknown Agent',
                        'description': 'Unsupported data URI format'
                    }

                # Ensure metadata is a dict
                if isinstance(metadata, list):
                    logger.warning(
                        "data_uri_is_list",
                        network=self.network_key,
                        list_length=len(metadata)
                    )
                    if len(metadata) > 0 and isinstance(metadata[0], dict):
                        metadata = metadata[0]
                    else:
                        return {
                            'name': 'Unknown Agent',
                            'description': 'Data URI contains a list',
                            'raw_data': metadata
                        }
                if not isinstance(metadata, dict):
                    return {
                        'name': 'Unknown Agent',
                        'description': f'Data URI has unexpected type: {type(metadata).__name__}'
                    }

                logger.info(
                    "data_uri_parsed",
                    network=self.network_key,
                    format="base64" if 'base64,' in uri else "plain",
                    name=metadata.get('name', 'Unknown')
                )
                return metadata
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
                async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    data = response.json()
                    # Ensure we always return a dict, not a list
                    if isinstance(data, list):
                        logger.warning(
                            "metadata_is_list",
                            network=self.network_key,
                            url=url,
                            list_length=len(data)
                        )
                        # If it's a list, try to use first item or wrap it
                        if len(data) > 0 and isinstance(data[0], dict):
                            return data[0]
                        return {
                            'name': 'Unknown Agent',
                            'description': 'Metadata is a list, not an object',
                            'raw_data': data
                        }
                    if not isinstance(data, dict):
                        logger.warning(
                            "metadata_unexpected_type",
                            network=self.network_key,
                            url=url,
                            type=type(data).__name__
                        )
                        return {
                            'name': 'Unknown Agent',
                            'description': f'Metadata has unexpected type: {type(data).__name__}'
                        }
                    return data
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
        raw_skills = []
        raw_domains = []

        # Try to extract from metadata services (Jan 2026 主网格式)
        # Also check endpoints for backward compatibility
        services_list = metadata.get('services') or metadata.get('endpoints') or []
        if isinstance(services_list, list):
            for service in services_list:
                if isinstance(service, dict):
                    if 'skills' in service and isinstance(service['skills'], list):
                        raw_skills.extend(service['skills'])
                    if 'domains' in service and isinstance(service['domains'], list):
                        raw_domains.extend(service['domains'])

        # Validate extracted skills/domains against OASF standard
        # Only include values that are in the official OASF taxonomy
        valid_skills = [s for s in raw_skills if s in OASF_SKILLS]
        valid_domains = [d for d in raw_domains if d in OASF_DOMAINS]

        # Log invalid entries for debugging
        invalid_skills = [s for s in raw_skills if s not in OASF_SKILLS]
        invalid_domains = [d for d in raw_domains if d not in OASF_DOMAINS]
        if invalid_skills or invalid_domains:
            logger.debug(
                "oasf_invalid_entries_filtered",
                network=self.network_key,
                name=name,
                invalid_skills=invalid_skills[:3],
                invalid_domains=invalid_domains[:3]
            )

        # Only set source="metadata" if we have valid OASF entries
        if valid_skills or valid_domains:
            logger.info(
                "oasf_extracted_from_services",
                network=self.network_key,
                name=name,
                skills_count=len(valid_skills),
                domains_count=len(valid_domains)
            )
            return {
                "skills": list(set(valid_skills))[:5],
                "domains": list(set(valid_domains))[:3],
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


# Default sync service: Ethereum Mainnet (Production)
blockchain_sync_service = get_sync_service("ethereum")


# Convenience functions for scheduler
async def sync_ethereum():
    """Sync Ethereum Mainnet (Production)"""
    service = get_sync_service("ethereum")
    await service.sync()


async def sync_sepolia():
    """Sync Sepolia network (Testnet)"""
    service = get_sync_service("sepolia")
    await service.sync()


async def sync_base_sepolia():
    """Sync Base Sepolia network"""
    service = get_sync_service("base-sepolia")
    await service.sync()


async def sync_bsc_testnet():
    """Sync BSC Testnet network"""
    service = get_sync_service("bsc-testnet")
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
