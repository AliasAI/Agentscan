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

export interface Stats {
  total_agents: number;
  active_agents: number;
  total_networks: number;
  total_activities: number;
  updated_at: string;
  blockchain_sync?: BlockchainSyncStatus;
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
