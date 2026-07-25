import React, { useRef, useEffect, useState } from "react";

interface ContextMenuItem {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu = ({ x, y, items: menuItems, onClose }: ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      let ax = x, ay = y;
      if (rect.right > window.innerWidth) ax = window.innerWidth - rect.width - 8;
      if (rect.bottom > window.innerHeight) ay = window.innerHeight - rect.height - 8;
      if (ax < 4) ax = 4;
      if (ay < 4) ay = 4;
      setPos({ x: ax, y: ay });
    }
  }, [x, y]);

  if (!x && !y) return null;

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[9999] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-xl py-1 min-w-[160px]"
      style={{ left: pos.x, top: pos.y }}
    >
      {menuItems.map((item, i) =>
        item.separator ? (
          <div key={i} role="separator" className="h-px bg-[var(--color-border)] my-1" />
        ) : (
          <button
            key={i}
            role="menuitem"
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={() => { item.onClick(); onClose(); }}
          >
            {item.icon && <span className="text-[var(--color-text-muted)]">{item.icon}</span>}
            {item.label}
          </button>
        )
      )}
    </div>
  );
};

export default ContextMenu;
