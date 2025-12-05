// Demo search page type definitions

export type AgentStatus = 'active' | 'inactive' | 'validating';

export type SortOption = 'comprehensive' | 'hot' | 'newest' | 'reputation' | 'name';

export type CreatedTimePreset = '24h' | '7d' | '30d' | 'custom';

export interface DemoAgent {
  id: string;
  name: string;
  address: string;
  description: string;
  network: string;
  tokenId: number;
  ownerAddress: string;
  status: AgentStatus;
  reputationScore: number;
  reputationCount: number;
  skills: string[];
  domains: string[];
  mcpTools: string[];
  a2aSkills: string[];
  createdAt: string;
  // Computed scores for sorting
  activityScore: number;
  relevanceScore: number;
  taxonomyCoverage: number;
}

export interface FilterState {
  networks: string[];
  skills: string[];
  domains: string[];
  reputationRange: [number, number];
  status: AgentStatus[];
  createdTime: CreatedTimePreset | null;
}

export interface SkillCategory {
  slug: string;
  name: string;
  count: number;
  subcategories: {
    slug: string;
    name: string;
    count: number;
  }[];
}

export interface DomainCategory {
  slug: string;
  name: string;
  count: number;
  subcategories: {
    slug: string;
    name: string;
    count: number;
  }[];
}

export interface SearchSuggestion {
  type: 'agent' | 'skill' | 'domain' | 'history';
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
  highlight?: string;
}

export interface HotSearchItem {
  query: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  isNew?: boolean;
}
