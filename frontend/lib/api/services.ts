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
