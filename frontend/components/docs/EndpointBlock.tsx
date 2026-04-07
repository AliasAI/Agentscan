'use client';

import { useState } from 'react';
import { ParamsTable } from './ParamsTable';
import { CodeBlock } from './CodeBlock';

interface Param {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description: string;
}

interface EndpointBlockProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params?: Param[];
  response?: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function EndpointBlock({ method, path, description, params, response }: EndpointBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#e5e5e5] dark:border-[#333] rounded-lg my-6 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] dark:hover:bg-[#111] transition-colors text-left"
      >
        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm font-mono text-[#0a0a0a] dark:text-[#e5e5e5] flex-1">{path}</code>
        <svg
          className={`w-4 h-4 text-[#6e6e73] transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="px-4 pb-1 border-t border-[#e5e5e5] dark:border-[#333] pt-3">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">{description}</p>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {params && params.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">Parameters</h4>
              <ParamsTable params={params} />
            </div>
          )}
          {response && (
            <div>
              <h4 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">Example Response</h4>
              <CodeBlock code={response} language="json" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
