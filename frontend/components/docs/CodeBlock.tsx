'use client';

import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = 'json', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[#e5e5e5] dark:border-[#333] overflow-hidden my-4">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#f5f5f5] dark:bg-[#1a1a1a] border-b border-[#e5e5e5] dark:border-[#333]">
          <span className="text-xs font-medium text-[#6e6e73] dark:text-[#86868b]">{title}</span>
          <button
            onClick={handleCopy}
            className="text-xs text-[#6e6e73] dark:text-[#86868b] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      {!title && (
        <div className="flex justify-end px-4 py-1.5 bg-[#f5f5f5] dark:bg-[#1a1a1a] border-b border-[#e5e5e5] dark:border-[#333]">
          <button
            onClick={handleCopy}
            className="text-xs text-[#6e6e73] dark:text-[#86868b] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto bg-[#fafafa] dark:bg-[#111] text-sm leading-relaxed">
        <code className={`language-${language} text-[#0a0a0a] dark:text-[#e5e5e5]`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
