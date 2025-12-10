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
  transaction_hash?: string | null; // on-chain transaction hash
}

export interface ValidationListResponse {
  items: Validation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  subgraph_available?: boolean; // False if network doesn't have subgraph support
}

// Reputation Summary from Subgraph
export interface ReputationSummary {
  feedback_count: number;
  average_score: number;
  validation_count: number;
}
