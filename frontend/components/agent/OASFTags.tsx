/**
 * OASF Skills 和 Domains 标签组件
 *
 * 用于展示 agent 的 skills 和 domains 分类标签
 */

interface OASFTagsProps {
  skills?: string[];
  domains?: string[];
  maxDisplay?: number;
  classificationSource?: string | null;
  compact?: boolean;
}

export function OASFTags({ skills = [], domains = [], maxDisplay = 3, classificationSource, compact = false }: OASFTagsProps) {
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

  const tagSize = compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  const gapSize = compact ? 'gap-1' : 'gap-1.5';

  return (
    <div className={`flex flex-wrap ${gapSize} items-center`}>
      {allTags.map((tag, index) => (
        <span
          key={`${tag.type}-${index}`}
          className={`inline-flex items-center rounded font-medium ${tagSize} ${
            tag.type === 'skill'
              ? 'bg-[#f5f5f5] text-[#0a0a0a] dark:bg-[#262626] dark:text-[#fafafa]'
              : 'bg-[#f5f5f5] text-[#525252] dark:bg-[#262626] dark:text-[#a3a3a3]'
          }`}
        >
          {formatTagName(tag.value)}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className={`inline-flex items-center rounded font-medium bg-[#f5f5f5] text-[#737373] dark:bg-[#262626] dark:text-[#737373] ${tagSize}`}>
          +{remainingCount}
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
  classificationSource?: string | null;
}

export function OASFDetailTags({ skills = [], domains = [], classificationSource }: OASFDetailTagsProps) {
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
      <div className="text-sm text-[#737373] dark:text-[#737373]">
        No skills or domains classified yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classificationSource && (
        <div className="flex items-center gap-2 pb-2 border-b border-[#e5e5e5] dark:border-[#262626]">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
            classificationSource === 'metadata'
              ? 'bg-[#f0fdf4] text-[#22c55e] dark:bg-[#14532d]/30 dark:text-[#4ade80]'
              : 'bg-[#f5f5f5] text-[#525252] dark:bg-[#262626] dark:text-[#a3a3a3]'
          }`}>
            {classificationSource === 'metadata' ? 'Agent' : 'AI'}
          </span>
          <span className="text-xs text-[#737373] dark:text-[#737373]">
            {classificationSource === 'metadata'
              ? 'Extracted from agent metadata (OASF standard)'
              : 'Automatically classified by AI'}
          </span>
        </div>
      )}
      {safeSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-[#0a0a0a] dark:text-[#fafafa]">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {safeSkills.map((skill, index) => (
              <div
                key={index}
                className="inline-flex flex-col bg-[#f5f5f5] dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-lg px-3 py-2"
              >
                <span className="text-xs text-[#737373] dark:text-[#737373] font-medium">
                  {getCategory(skill)}
                </span>
                <span className="text-sm text-[#0a0a0a] dark:text-[#fafafa]">
                  {formatTagName(skill)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {safeDomains.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-[#0a0a0a] dark:text-[#fafafa]">Domains</h4>
          <div className="flex flex-wrap gap-2">
            {safeDomains.map((domain, index) => (
              <div
                key={index}
                className="inline-flex flex-col bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#d4d4d4] dark:border-[#404040] rounded-lg px-3 py-2"
              >
                <span className="text-xs text-[#a3a3a3] dark:text-[#525252] font-medium">
                  {getCategory(domain)}
                </span>
                <span className="text-sm text-[#525252] dark:text-[#a3a3a3]">
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
