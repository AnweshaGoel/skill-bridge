import { useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import clsx from "clsx";
import type { InterviewResponse, InterviewQuestion } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";

interface InterviewPanelProps {
  interview: InterviewResponse;
  onRegenerate: () => void;
  regenerating: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  "system-design": "System Design",
};

const DIFFICULTY_VARIANT: Record<string, "present" | "partial" | "missing"> = {
  easy: "present",
  medium: "partial",
  hard: "missing",
};

function QuestionAccordion({ q }: { q: InterviewQuestion }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
      <button
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--bg-secondary)] transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronDown
          size={15}
          className={clsx(
            "text-[var(--text-muted)] flex-shrink-0 mt-0.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-primary)]">{q.question}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={DIFFICULTY_VARIANT[q.difficulty] ?? "neutral"}>
              {q.difficulty}
            </Badge>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {q.skill_tested}
            </span>
          </div>
        </div>
      </button>

      {open && q.hint && (
        <div className="px-4 pb-3 pt-0 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            <span className="font-medium text-[var(--text-muted)]">Hint: </span>
            {q.hint}
          </p>
        </div>
      )}
    </div>
  );
}

export function InterviewPanel({
  interview,
  onRegenerate,
  regenerating,
}: InterviewPanelProps) {
  const categories = ["technical", "system-design", "behavioral"] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif">Mock Interview</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {interview.questions.length} questions across{" "}
            {new Set(interview.questions.map((q) => q.category)).size}{" "}
            categories
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRegenerate}
          loading={regenerating}
          disabled={regenerating}
        >
          {regenerating ? (
            <Spinner size="sm" />
          ) : (
            <RefreshCw size={14} />
          )}
          Regenerate
        </Button>
      </div>

      {interview.used_fallback && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-fallback-bg)] border border-[var(--color-fallback)] text-[var(--color-fallback)] text-xs font-mono mb-4">
          <Badge variant="fallback">offline mode</Badge>
          <span>AI unavailable — showing template questions</span>
        </div>
      )}

      <div className="space-y-6">
        {categories.map((cat) => {
          const qs = interview.questions.filter((q) => q.category === cat);
          if (qs.length === 0) return null;
          return (
            <div key={cat}>
              <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
                {CATEGORY_LABEL[cat]}
              </h3>
              <div className="space-y-2">
                {qs.map((q, i) => (
                  <QuestionAccordion key={i} q={q} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
