import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

interface CollapsiblePanelProps {
  title: string;
  icon: React.ReactNode;
  defaultCollapsed?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  icon,
  defaultCollapsed = false,
  actions,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const bodyId = `collapsible-panel-${title.replace(/\s+/g, '-')}`;

  return (
    <div className="card">
      <div className="card-header w-full flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-2.5 text-left flex-1 py-1 cursor-pointer hover:bg-[var(--color-bg-hover)] rounded-[var(--radius)] transition-colors"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
        >
          <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            {icon}
          </div>
          <span className="card-title flex-1">{title}</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <button
            type="button"
            className="p-2 rounded-[var(--radius)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] transition-colors"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            aria-label={collapsed ? `${title} (aç)` : `${title} (kapat)`}
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>
      {!collapsed && <div className="card-body" id={bodyId}>{children}</div>}
    </div>
  );
};

export default React.memo(CollapsiblePanel);
