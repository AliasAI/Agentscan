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
