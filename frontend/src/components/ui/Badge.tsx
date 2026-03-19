import clsx from "clsx";
import { ReactNode } from "react";

type BadgeVariant = "present" | "missing" | "partial" | "fallback" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  present:
    "bg-[var(--color-present-bg)] text-[var(--color-present)] border-[var(--color-present)]",
  missing:
    "bg-[var(--color-missing-bg)] text-[var(--color-missing)] border-[var(--color-missing)]",
  partial:
    "bg-[var(--color-partial-bg)] text-[var(--color-partial)] border-[var(--color-partial)]",
  fallback:
    "bg-[var(--color-fallback-bg)] text-[var(--color-fallback)] border-[var(--color-fallback)]",
  neutral:
    "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded-[var(--radius-sm)] border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
