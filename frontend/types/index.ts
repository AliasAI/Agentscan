// Agentscan 核心数据类型定义

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  VALIDATING = 'validating',
}

export enum SyncStatus {
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
}

export enum ActivityType {
  REGISTERED = 'registered',
  REPUTATION_UPDATE = 'reputation_update',
  VALIDATION_COMPLETE = 'validation_complete',
}

export interface Agent {
  id: string;
  name: string;
  address: string;
  description: string;
  reputation_score: number;
  status: AgentStatus;
  network_id: string;
  network_name?: string;  // 前端根据 network_id 映射
  created_at: string;
  updated_at: string;

  // Blockchain data fields
  token_id?: number;
  owner_address?: string;
  metadata_uri?: string;
  on_chain_data?: Record<string, any>;
  last_synced_at?: string;
  sync_status?: SyncStatus;

  // Reputation data fields
  reputation_count?: number;
  reputation_last_updated?: string;

  // OASF taxonomy fields
  skills?: string[];
  domains?: string[];
  classification_source?: string | null;  // "metadata" or "ai"
}

export interface Contracts {
  identity: string;
  reputation: string;
  validation: string;
}

export interface Network {
  id: string;
  name: string;
  chain_id: number;
  rpc_url: string;
  explorer_url: string;
  contracts: Contracts | null;
  created_at: string;
}

export interface NetworkWithStats {
  id: string;
  name: string;
  chain_id: number;
  explorer_url: string;
  agent_count: number;
}

export interface Activity {
  id: string;
  agent_id: string;
  activity_type: ActivityType;
  description: string;
  tx_hash?: string;
  created_at: string;
  agent?: Agent;
}

export interface BlockchainSyncStatus {
  current_block: number;
  latest_block: number;
  sync_progress: number; // 0-100
  is_syncing: boolean;
  last_synced_at: string | null;
}

export interface NetworkSyncStatus {
  network_name: string;
  network_key: string;
  current_block: number;
  latest_block: number;
  sync_progress: number; // 0-100
  is_syncing: boolean;
  last_synced_at: string | null;
}

export interface MultiNetworkSyncStatus {
  overall_progress: number;
  is_syncing: boolean;
  networks: NetworkSyncStatus[];
}

export interface Stats {
  total_agents: number;
  active_agents: number;
  total_networks: number;
  total_activities: number;
  updated_at: string;
  blockchain_sync?: BlockchainSyncStatus;
  multi_network_sync?: MultiNetworkSyncStatus;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RegistrationTrendData {
  date: string;
  count: number;
}

export interface RegistrationTrendResponse {
  data: RegistrationTrendData[];
}

// Category Distribution (OASF Taxonomy)
export interface CategoryItem {
  category: string;
  slug: string;
  count: number;
  percentage: number;
}

export interface CategoryDistributionData {
  skills: CategoryItem[];
  domains: CategoryItem[];
  total_classified: number;
  total_agents: number;
}

// Feedback (Review) from Subgraph
export interface Feedback {
  id: string;
  score: number; // 0-100
  client_address: string;
  tag1?: string | null;
  tag2?: string | null;
  feedback_uri?: string | null;
  feedback_hash?: string | null;
  is_revoked: boolean;
  timestamp?: string | null;
  block_number?: number | null;
  transaction_hash?: string | null;
}

export interface FeedbackListResponse {
  items: Feedback[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  subgraph_available?: boolean; // False if network doesn't have subgraph support
  data_source?: 'subgraph' | 'on-chain' | 'none'; // Data source indicator
}

// Validation from Subgraph
export enum ValidationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

export interface Validation {
  id: string;
  request_hash?: string | null;
  request_uri?: string | null;
  validator_address: string;
  response?: number | null; // 0-100 score
  response_uri?: string | null;
  response_hash?: string | null;
  tag?: string | null;
  status: ValidationStatus | string;
  requested_at?: string | null;  // createdAt from subgraph
  completed_at?: string | null;  // updatedAt from subgraph
  transaction_hash?: string | null;  // Transaction hash from subgraph
}

export interface ValidationListResponse {
  items: Validation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  subgraph_available?: boolean; // False if network doesn't have subgraph support
  data_source?: 'subgraph' | 'on-chain' | 'none'; // Data source indicator
}

// Reputation Summary from Subgraph
export interface ReputationSummary {
  feedback_count: number;
  average_score: number;
  validation_count: number;
}

// Endpoint Health Check Types
export interface EndpointHealth {
  url: string;
  is_healthy: boolean;
  status_code?: number | null;
  response_time_ms?: number | null;
  error?: string | null;
  checked_at?: string | null;
}

export interface AgentEndpointReport {
  agent_id: string;
  agent_name: string;
  token_id?: number | null;
  network_key: string;
  metadata_uri?: string | null;
  has_working_endpoints: boolean;
  total_endpoints: number;
  healthy_endpoints: number;
  endpoints: EndpointHealth[];
  recent_feedbacks: Feedback[];
  reputation_score: number;
  reputation_count: number;
}

export interface EndpointSummary {
  total_agents: number;
  agents_with_endpoints: number;
  agents_with_working_endpoints: number;
  agents_with_feedbacks: number;
  total_endpoints: number;
  healthy_endpoints: number;
  endpoint_health_rate: number;
  // Reputation stats
  total_feedbacks?: number;
  avg_reputation_score?: number;
}

// Agent with reputation info (for top reputation list)
export interface ReputationAgent {
  agent_id: string;
  agent_name: string;
  token_id: number;
  network_key: string;
  reputation_score: number;
  reputation_count: number;
  has_working_endpoints: boolean;
}

export interface EndpointHealthSummaryResponse {
  summary: EndpointSummary;
  working_agents: AgentEndpointReport[];
  generated_at: string;
}

// SSE Stream Event Types for real-time health check
export interface EndpointStreamEvent {
  type: 'start' | 'progress' | 'skip' | 'complete';
  total?: number;
  checked?: number;
  working?: number;
  agent_id?: string;
  report?: AgentEndpointReport;
}

// ============================================
// Web3 / Wallet / Create Agent Types
// ============================================

// Supported network for wallet connection
export interface SupportedNetwork {
  id: number;
  name: string;
  contractAddress: `0x${string}`;
}

// Form input for creating agent endpoints
export interface EndpointInput {
  url: string;
  skills: string[];
  domains: string[];
}

// Form state for creating an agent
export interface CreateAgentForm {
  name: string;
  description: string;
  endpoints: EndpointInput[];
}

// Agent metadata (OASF compliant)
export interface AgentMetadata {
  name: string;
  description: string;
  endpoints: Array<{
    url: string;
    skills: string[];
    domains: string[];
  }>;
  version: string;
  created_at: string;
}

// OASF Taxonomy item from API
export interface TaxonomyItem {
  slug: string;
  display_name: string;
}

// Taxonomy API response
export interface TaxonomyResponse {
  count: number;
  skills?: TaxonomyItem[];
  domains?: TaxonomyItem[];
}

// Transaction status for UI
export type TransactionStatus = 'idle' | 'uploading' | 'pending' | 'confirming' | 'success' | 'error';
