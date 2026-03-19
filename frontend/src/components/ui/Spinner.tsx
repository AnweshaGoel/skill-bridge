import clsx from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <svg
      className={clsx("animate-spin text-[var(--text-muted)]", sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-label="Loading"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
