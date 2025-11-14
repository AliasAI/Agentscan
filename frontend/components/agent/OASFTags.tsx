/**
 * OASF Skills 和 Domains 标签组件
 *
 * 用于展示 agent 的 skills 和 domains 分类标签
 */

interface OASFTagsProps {
  skills?: string[];
  domains?: string[];
  maxDisplay?: number;
}

export function OASFTags({ skills = [], domains = [], maxDisplay = 3 }: OASFTagsProps) {
  // 确保 skills 和 domains 是数组（处理 null/undefined 情况）
  const safeSkills = Array.isArray(skills) ? skills : [];
  const safeDomains = Array.isArray(domains) ? domains : [];

  // 将 slug 转换为显示名称
  const formatTagName = (slug: string): string => {
    if (slug.includes('/')) {
      const parts = slug.split('/');
      const name = parts[parts.length - 1];
      return name.replace(/_/g, ' ').split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return slug.replace(/_/g, ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const allTags = [
    ...safeSkills.slice(0, maxDisplay).map(skill => ({ type: 'skill', value: skill })),
    ...safeDomains.slice(0, maxDisplay).map(domain => ({ type: 'domain', value: domain })),
  ];

  if (allTags.length === 0) {
    return null;
  }

  const remainingCount = (safeSkills.length + safeDomains.length) - allTags.length;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {allTags.map((tag, index) => (
        <span
          key={`${tag.type}-${index}`}
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            tag.type === 'skill'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
          }`}
        >
          {tag.type === 'skill' && '⚡ '}
          {tag.type === 'domain' && '🏢 '}
          {formatTagName(tag.value)}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

/**
 * 详细的 OASF 标签组件（用于详情页）
 */
interface OASFDetailTagsProps {
  skills?: string[];
  domains?: string[];
}

export function OASFDetailTags({ skills = [], domains = [] }: OASFDetailTagsProps) {
  // 确保 skills 和 domains 是数组（处理 null/undefined 情况）
  const safeSkills = Array.isArray(skills) ? skills : [];
  const safeDomains = Array.isArray(domains) ? domains : [];

  const formatTagName = (slug: string): string => {
    if (slug.includes('/')) {
      const parts = slug.split('/');
      const name = parts[parts.length - 1];
      return name.replace(/_/g, ' ').split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return slug.replace(/_/g, ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCategory = (slug: string): string => {
    if (slug.includes('/')) {
      const category = slug.split('/')[0];
      return category.replace(/_/g, ' ').split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return 'General';
  };

  if (safeSkills.length === 0 && safeDomains.length === 0) {
    return (
      <div className="text-sm text-foreground/60">
        No skills or domains classified yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {safeSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {safeSkills.map((skill, index) => (
              <div
                key={index}
                className="inline-flex flex-col bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2"
              >
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {getCategory(skill)}
                </span>
                <span className="text-sm text-blue-900 dark:text-blue-200">
                  {formatTagName(skill)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {safeDomains.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Domains</h4>
          <div className="flex flex-wrap gap-2">
            {safeDomains.map((domain, index) => (
              <div
                key={index}
                className="inline-flex flex-col bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2"
              >
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  {getCategory(domain)}
                </span>
                <span className="text-sm text-purple-900 dark:text-purple-200">
                  {formatTagName(domain)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
