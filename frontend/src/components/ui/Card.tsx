import { ReactNode, HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
}

const paddingSizes = { sm: "p-4", md: "p-6", lg: "p-8" };

export function Card({ children, padding = "md", className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)]",
        paddingSizes[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
