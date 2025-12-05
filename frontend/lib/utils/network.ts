/**
 * 网络配置映射工具
 * 用于根据 network_name 获取网络配置信息
 */

export interface NetworkConfig {
  explorerUrl: string;
  contractAddress: string;
}

// 网络配置映射（通过 network_name 索引）
export const NETWORK_CONFIG_BY_NAME: Record<string, NetworkConfig> = {
  'Sepolia': {
    explorerUrl: 'https://sepolia.etherscan.io',
    contractAddress: '0x8004a6090Cd10A7288092483047B097295Fb8847',
  },
  'Base Sepolia': {
    explorerUrl: 'https://sepolia.basescan.org',
    contractAddress: '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb',
  },
  'BSC Testnet': {
    explorerUrl: 'https://testnet.bscscan.com',
    contractAddress: '0x4f8c8694eAB93bbF7616EDD522503544E61E7dB7',
  },
  'Linea Sepolia': {
    explorerUrl: 'https://sepolia.lineascan.build',
    contractAddress: '0x8004aa7C931bCE1233973a0C6A667f73F66282e7',
  },
  'Hedera Testnet': {
    explorerUrl: 'https://hashscan.io/testnet',
    contractAddress: '0x0dDaa2de07deb24D5F0288ee29c3c57c4159DcC7',
  },
};

/**
 * 根据 network_name 获取区块浏览器 URL
 */
export function getExplorerUrl(networkName: string): string {
  return NETWORK_CONFIG_BY_NAME[networkName]?.explorerUrl || 'https://etherscan.io';
}

/**
 * 根据 network_name 获取合约地址
 */
export function getContractAddress(networkName: string): string {
  return NETWORK_CONFIG_BY_NAME[networkName]?.contractAddress || '';
}

/**
 * 生成 NFT 浏览器链接
 */
export function getNftExplorerUrl(networkName: string, tokenId: number): string {
  const config = NETWORK_CONFIG_BY_NAME[networkName];
  if (!config) return '#';
  return `${config.explorerUrl}/nft/${config.contractAddress}/${tokenId}`;
}
