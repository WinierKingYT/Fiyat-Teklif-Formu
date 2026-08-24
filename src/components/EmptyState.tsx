import { Inbox, SearchX, FileText } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  inbox: <Inbox size={24} />,
  search: <SearchX size={24} />,
  file: <FileText size={24} />,
};

export default function EmptyState({ icon, title, text, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 space-y-1.5 animate-fadeIn" role="status" aria-live="polite">
      <div className="text-[var(--color-text-muted)] opacity-60 mb-1" aria-hidden="true">
        {icon || ICON_MAP.inbox}
      </div>
      <div className="text-xs font-semibold text-[var(--color-text)]">{title}</div>
      {text && <div className="text-[11px] text-[var(--color-text-muted)] max-w-xs">{text}</div>}
      {action && <div className="pt-2">{action}</div>}
      {/* Faz4: EmptyState CTA fallback – action yoksa gösterilmez, aria iyileştirmesi eklendi */}
    </div>
  );
}
