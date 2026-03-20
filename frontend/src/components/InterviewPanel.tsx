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

const DIFFICULTY_VARIANT: Record<string, "present" | "partial" | "missing"> = {
  easy: "present",
  medium: "partial",
  hard: "missing",
};

type DifficultyFilter = "all" | "easy" | "medium" | "hard";

const DIFFICULTY_FILTERS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function QuestionAccordion({ q, index }: { q: InterviewQuestion; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
      <button
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--bg-secondary)] transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-mono text-xs text-[var(--text-muted)] flex-shrink-0 mt-0.5 w-5">
          {index + 1}.
        </span>
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
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");

  const filtered =
    difficulty === "all"
      ? interview.questions
      : interview.questions.filter((q) => q.difficulty === difficulty);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-serif">Mock Interview</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {interview.questions.length} questions
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRegenerate}
          loading={regenerating}
          disabled={regenerating}
        >
          {regenerating ? <Spinner size="sm" /> : <RefreshCw size={14} />}
          Regenerate
        </Button>
      </div>

      {interview.used_fallback && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-fallback-bg)] border border-[var(--color-fallback)] text-[var(--color-fallback)] text-xs font-mono mb-4">
          <Badge variant="fallback">offline mode</Badge>
          <span>AI unavailable — showing template questions</span>
        </div>
      )}

      {/* Difficulty filter */}
      <div className="flex gap-2 mb-5">
        {DIFFICULTY_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setDifficulty(value)}
            className={clsx(
              "px-3 py-1 rounded-full text-xs font-mono border transition-colors",
              difficulty === value
                ? "bg-[var(--bg-accent)] text-[var(--bg-primary)] border-[var(--bg-accent)]"
                : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]"
            )}
          >
            {label}
            {value !== "all" && (
              <span className="ml-1 opacity-60">
                ({interview.questions.filter((q) => q.difficulty === value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">
          No {difficulty} questions in this set.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((q, i) => (
            <QuestionAccordion key={i} q={q} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
