import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#171717] rounded-lg border border-[#e5e5e5] dark:border-[#262626] p-6 ${className}`}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-[#0a0a0a] dark:text-[#fafafa]">{title}</h3>
      )}
      {children}
    </div>
  );
}
