// Score Ring components for visual reputation display

interface ScoreRingProps {
  score: number;
  size?: number;
}

// Color configuration based on score thresholds
function getScoreColor(score: number) {
  if (score >= 71) return { stroke: '#22c55e', darkStroke: '#4ade80', label: 'Excellent' };
  if (score >= 41) return { stroke: '#eab308', darkStroke: '#facc15', label: 'Good' };
  return { stroke: '#ef4444', darkStroke: '#f87171', label: 'Needs Improvement' };
}

// Small score ring for cards (36px default)
export function ScoreRing({ score, size = 36 }: ScoreRingProps) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[#f5f5f5] dark:text-[#262626]"
        />
        {/* Progress circle - light mode */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-500 dark:hidden"
        />
        {/* Progress circle - dark mode */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.darkStroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-500 hidden dark:block"
        />
      </svg>
      {/* Score text */}
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#0a0a0a] dark:text-[#fafafa]">
        {score.toFixed(0)}
      </span>
    </div>
  );
}

// Large score ring for detail pages (120px default)
export function LargeScoreRing({ score, size = 120 }: ScoreRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[#f5f5f5] dark:text-[#262626]"
          />
          {/* Progress circle - light mode */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-700 ease-out dark:hidden"
          />
          {/* Progress circle - dark mode */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.darkStroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-700 ease-out hidden dark:block"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
            {score.toFixed(0)}
          </span>
          <span className="text-[10px] text-[#737373] uppercase tracking-wide">
            / 100
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium" style={{ color: colors.stroke }}>
        {colors.label}
      </span>
    </div>
  );
}

// Empty state ring for agents without reviews
export function EmptyScoreRing({ size = 36, large = false }: { size?: number; large?: boolean }) {
  if (large) {
    return (
      <div className="flex flex-col items-center">
        <div
          className="rounded-full border-[8px] border-dashed border-[#e5e5e5] dark:border-[#404040] flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-2xl text-[#a3a3a3] dark:text-[#525252]">—</span>
        </div>
        <span className="mt-2 text-xs text-[#a3a3a3]">No reviews yet</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-full border-2 border-dashed border-[#e5e5e5] dark:border-[#404040] flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="text-[10px] text-[#a3a3a3] dark:text-[#525252]">—</span>
    </div>
  );
}
