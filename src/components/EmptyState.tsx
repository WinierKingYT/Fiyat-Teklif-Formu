import React from 'react';
import { Inbox, SearchX, FileText } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  inbox: <Inbox size={32} />,
  search: <SearchX size={32} />,
  file: <FileText size={32} />,
};

export default function EmptyState({ icon, title, text, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fadeIn">
      <div className="empty-state-icon">
        {icon || ICON_MAP.inbox}
      </div>
      <div className="empty-state-title">{title}</div>
      {text && <div className="empty-state-text">{text}</div>}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
}
