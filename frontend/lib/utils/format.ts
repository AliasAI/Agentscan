// 格式化工具函数

export function formatAddress(address: string, length = 8): string {
  if (address.length <= length) return address;
  const start = Math.floor(length / 2);
  const end = Math.ceil(length / 2);
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(date: string): string {
  if (!date) return 'N/A';

  // 确保日期字符串被当作 UTC 时间解析
  let utcDateStr = date;
  if (date.includes('T') && !date.endsWith('Z') && !date.match(/[+-]\d{2}:\d{2}$/)) {
    utcDateStr = date + 'Z';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(utcDateStr));
}

export function formatRelativeTime(date: string): string {
  if (!date) return 'N/A';

  const now = new Date();

  // 确保日期字符串被当作 UTC 时间解析
  // 后端返回的是 UTC 时间，但可能没有 Z 后缀
  // 如果是 ISO 8601 格式（包含 T）但没有时区标识，添加 Z
  let utcDateStr = date;
  if (date.includes('T') && !date.endsWith('Z') && !date.match(/[+-]\d{2}:\d{2}$/)) {
    utcDateStr = date + 'Z';
  }

  const target = new Date(utcDateStr);
  const diff = now.getTime() - target.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} days ago`;
  if (hours > 0) return `${hours} hours ago`;
  if (minutes > 0) return `${minutes} minutes ago`;
  return 'just now';
}

/**
 * Format time ago in compact form (e.g., "2h ago", "3d ago")
 * Used for trending section and compact displays
 */
export function formatTimeAgo(date: string): string {
  if (!date) return 'N/A';

  let utcDateStr = date;
  if (date.includes('T') && !date.endsWith('Z') && !date.match(/[+-]\d{2}:\d{2}$/)) {
    utcDateStr = date + 'Z';
  }

  const target = new Date(utcDateStr);
  const diff = Date.now() - target.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'now';
}

/**
 * Resolve image URI to a displayable URL
 * Handles: IPFS URIs, data URIs, HTTP/HTTPS URLs
 */
export function resolveImageUrl(uri: string | undefined | null): string | null {
  if (!uri || typeof uri !== 'string') return null;

  const trimmed = uri.trim();
  if (!trimmed) return null;

  // Handle IPFS URIs
  if (trimmed.startsWith('ipfs://')) {
    const hash = trimmed.slice(7);
    return `https://ipfs.io/ipfs/${hash}`;
  }

  // Handle data URIs (base64 images)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Handle HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Handle bare IPFS hashes (Qm... or bafy...)
  if (trimmed.startsWith('Qm') || trimmed.startsWith('bafy')) {
    return `https://ipfs.io/ipfs/${trimmed}`;
  }

  return null;
}
