/**
 * Network utility functions
 * Re-exports from the unified network configuration
 *
 * @deprecated Import directly from '@/lib/networks' instead
 */

export {
  getExplorerUrl,
  getContractAddress,
  getNftExplorerUrl,
  getTxExplorerUrl,
  NETWORKS_BY_NAME as NETWORK_CONFIG_BY_NAME,
  type NetworkConfig,
} from '@/lib/networks'
