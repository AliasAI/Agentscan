interface Param {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description: string;
}

interface ParamsTableProps {
  params: Param[];
}

export function ParamsTable({ params }: ParamsTableProps) {
  if (params.length === 0) return null;

  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-[#f5f5f5] dark:bg-[#1a1a1a]">
            <th className="text-left px-4 py-2.5 font-medium text-[#0a0a0a] dark:text-[#fafafa] border-b border-[#e5e5e5] dark:border-[#333]">Parameter</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#0a0a0a] dark:text-[#fafafa] border-b border-[#e5e5e5] dark:border-[#333]">Type</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#0a0a0a] dark:text-[#fafafa] border-b border-[#e5e5e5] dark:border-[#333]">Required</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#0a0a0a] dark:text-[#fafafa] border-b border-[#e5e5e5] dark:border-[#333]">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param, i) => (
            <tr key={param.name} className={i % 2 === 1 ? 'bg-[#fafafa] dark:bg-[#111]' : ''}>
              <td className="px-4 py-2.5 font-mono text-xs text-[#0a0a0a] dark:text-[#e5e5e5] border-b border-[#e5e5e5] dark:border-[#333]">
                {param.name}
              </td>
              <td className="px-4 py-2.5 text-[#6e6e73] dark:text-[#86868b] border-b border-[#e5e5e5] dark:border-[#333]">
                {param.type}
              </td>
              <td className="px-4 py-2.5 border-b border-[#e5e5e5] dark:border-[#333]">
                {param.required ? (
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Yes</span>
                ) : (
                  <span className="text-xs text-[#6e6e73] dark:text-[#86868b]">
                    {param.default ? `No (default: ${param.default})` : 'No'}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-[#525252] dark:text-[#a1a1a6] border-b border-[#e5e5e5] dark:border-[#333]">
                {param.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
