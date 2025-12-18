// API 服务层

import { apiGet } from './client';
import type {
  Agent,
  Network,
  NetworkWithStats,
  Activity,
  Stats,
  PaginatedResponse,
  RegistrationTrendResponse,
  CategoryDistributionData,
  FeedbackListResponse,
  ValidationListResponse,
  ReputationSummary,
  AgentEndpointReport,
  EndpointHealthSummaryResponse,
} from '@/types';

// 统计数据服务
export const statsService = {
  getStats: () => apiGet<Stats>('/stats'),
  getRegistrationTrend: (days: number = 30) =>
    apiGet<RegistrationTrendResponse>(`/stats/registration-trend?days=${days}`),
};

// 代理服务
export const agentService = {
  getAgents: (
    params?: {
      tab?: string;
      page?: number;
      page_size?: number;
      search?: string;
      network?: string;
      reputation_min?: number;
      reputation_max?: number;
    },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined && v !== null)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
    ).toString();
    return apiGet<PaginatedResponse<Agent>>(
      `/agents${query ? `?${query}` : ''}`,
      signal
    );
  },

  getFeaturedAgents: () =>
    apiGet<Agent[]>('/agents/featured'),

  getAgentById: (id: string) =>
    apiGet<Agent>(`/agents/${id}`),
};

// 网络服务
export const networkService = {
  getNetworks: () => apiGet<Network[]>('/networks'),

  getNetworksWithStats: () => apiGet<NetworkWithStats[]>('/networks/stats'),

  getNetworkById: (id: string) =>
    apiGet<Network>(`/networks/${id}`),
};

// 活动服务
export const activityService = {
  getActivities: (params?: {
    page?: number;
    page_size?: number;
  }) => {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiGet<PaginatedResponse<Activity>>(
      `/activities${query ? `?${query}` : ''}`
    );
  },

  getAgentActivities: (agentId: string) =>
    apiGet<Activity[]>(`/activities/agent/${agentId}`),
};

// 分类服务 (OASF Taxonomy)
export const taxonomyService = {
  // 获取分类分布统计
  getDistribution: () =>
    apiGet<CategoryDistributionData>('/taxonomy/distribution'),
};

// Feedback 服务 (Reviews & Validations from Subgraph)
export const feedbackService = {
  // 获取 Agent 的反馈历史
  getFeedbacks: (
    agentId: string,
    params?: { page?: number; page_size?: number }
  ) => {
    const query = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined && v !== null)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
    ).toString();
    return apiGet<FeedbackListResponse>(
      `/agents/${agentId}/feedbacks${query ? `?${query}` : ''}`
    );
  },

  // 获取 Agent 的验证历史
  getValidations: (
    agentId: string,
    params?: { page?: number; page_size?: number }
  ) => {
    const query = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined && v !== null)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
    ).toString();
    return apiGet<ValidationListResponse>(
      `/agents/${agentId}/validations${query ? `?${query}` : ''}`
    );
  },

  // 获取 Agent 的声誉摘要
  getReputationSummary: (agentId: string) =>
    apiGet<ReputationSummary>(`/agents/${agentId}/reputation-summary`),
};

// Endpoint Health 服务
export const endpointHealthService = {
  // 获取单个 Agent 的 Endpoint 健康状态
  getAgentEndpointHealth: (agentId: string, includeFeedbacks: boolean = true) =>
    apiGet<AgentEndpointReport>(
      `/agents/${agentId}/endpoint-health?include_feedbacks=${includeFeedbacks}`
    ),

  // 获取 Endpoint 健康状态摘要
  getSummary: (network?: string) => {
    const query = network ? `?network=${network}` : '';
    return apiGet<EndpointHealthSummaryResponse>(`/endpoint-health/summary${query}`);
  },

  // 获取有工作 Endpoint 的 Agent 列表
  getWorkingAgents: (params?: {
    network?: string;
    min_reputation?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined && v !== null)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
    ).toString();
    return apiGet<{ total_working: number; agents: AgentEndpointReport[] }>(
      `/endpoint-health/working-agents${query ? `?${query}` : ''}`
    );
  },

  // 获取 SSE 流的 URL（用于 EventSource）
  getStreamUrl: (network?: string, onlyWithEndpoints: boolean = false) => {
    const params = new URLSearchParams();
    if (network) params.set('network', network);
    if (onlyWithEndpoints) params.set('only_with_endpoints', 'true');
    const query = params.toString();
    return `/api/endpoint-health/stream${query ? `?${query}` : ''}`;
  },
};
