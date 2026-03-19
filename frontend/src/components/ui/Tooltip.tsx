import { ReactNode, useState } from "react";
import clsx from "clsx";

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={clsx("relative inline-flex items-center", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs rounded-[var(--radius-sm)] bg-[var(--bg-accent)] text-[var(--bg-primary)] whitespace-nowrap pointer-events-none z-50">
          {content}
        </span>
      )}
    </span>
  );
}
