import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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

  return (
    <div className="card">
      <button
        type="button"
        className="card-header w-full text-left cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            {icon}
          </div>
          <span className="card-title flex-1">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {actions && <span onClick={(e) => e.stopPropagation()}>{actions}</span>}
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </div>
      </button>
      {!collapsed && <div className="card-body">{children}</div>}
    </div>
  );
};

export default CollapsiblePanel;
