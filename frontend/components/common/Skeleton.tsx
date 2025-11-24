// Skeleton loading components for better UX - 黑白灰科技风格

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[#e5e5e5] dark:bg-[#262626] rounded ${className}`}
    />
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] p-4 h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-5 w-12 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-32 mb-2" />
      <div className="space-y-1.5 mb-2 flex-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex gap-1 mb-2">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-14 rounded" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div>
          <Skeleton className="h-2.5 w-16 mb-1" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-2 p-2">
      <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-12" />
        </div>
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-[#e5e5e5] dark:border-[#262626]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-6 w-full max-w-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
