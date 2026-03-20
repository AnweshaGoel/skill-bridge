import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink, CheckCircle2, Circle, Search } from "lucide-react";
import clsx from "clsx";

function searchUrl(title: string, platform: string): string {
  const p = platform.toLowerCase();
  const q = encodeURIComponent(title);
  if (p.includes("youtube")) {
    return `https://www.youtube.com/results?search_query=${q}`;
  }
  if (p.includes("coursera")) {
    return `https://www.coursera.org/search?query=${q}`;
  }
  if (p.includes("udemy")) {
    return `https://www.udemy.com/courses/search/?q=${q}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(title + " " + platform)}`;
}
import type { RoadmapResponse, Milestone } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface RoadmapViewProps {
  roadmap: RoadmapResponse;
  role: string;
}

function useProgress(role: string, totalMilestones: number) {
  const key = `roadmap-progress-${role}`;
  const [completed, setCompleted] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? new Set(JSON.parse(stored) as number[]) : new Set();
    } catch {
      return new Set();
    }
  });

  function toggle(week: number) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      localStorage.setItem(key, JSON.stringify([...next]));
      return next;
    });
  }

  return { completed, toggle, count: completed.size, total: totalMilestones };
}

function MilestoneCard({
  milestone,
  index,
  isCompleted,
  onToggleComplete,
}: {
  milestone: Milestone;
  index: number;
  isCompleted: boolean;
  onToggleComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3, ease: "easeOut" }}
      className="flex gap-4"
    >
      {/* Timeline indicator */}
      <div className="flex flex-col items-center flex-shrink-0">
        <button
          onClick={onToggleComplete}
          className="mt-1 transition-colors"
          aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {isCompleted ? (
            <CheckCircle2 size={20} className="text-[var(--color-present)]" />
          ) : (
            <Circle size={20} className="text-[var(--text-muted)]" />
          )}
        </button>
        <div className="w-px flex-1 bg-[var(--border)] mt-1" />
      </div>

      {/* Card */}
      <div
        className={clsx(
          "flex-1 mb-4 rounded-[var(--radius-lg)] border transition-colors overflow-hidden",
          isCompleted
            ? "border-[var(--color-present)] bg-[var(--color-present-bg)]"
            : "border-[var(--border)] bg-[var(--bg-card)]"
        )}
      >
        {/* Card header — always visible */}
        <button
          className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left gap-3"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-mono text-xs text-[var(--text-muted)] flex-shrink-0">
              Week {milestone.week}
            </span>
            <h3
              className={clsx(
                "font-serif text-base truncate",
                isCompleted ? "text-[var(--color-present)]" : "text-[var(--text-primary)]"
              )}
            >
              {milestone.title}
            </h3>
          </div>
          <ChevronDown
            size={16}
            className={clsx(
              "text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0",
              expanded && "rotate-180"
            )}
          />
        </button>

        {/* Expandable body */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-secondary)] pt-4">
                  {milestone.description}
                </p>

                {/* Skill badges */}
                {milestone.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {milestone.skills.map((s) => (
                      <Badge key={s} variant="neutral">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Resources */}
                {milestone.resources.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                      Resources
                    </p>
                    {milestone.resources.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <a
                            href={r.url ?? searchUrl(r.title, r.platform)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--text-primary)] hover:underline flex items-center gap-1"
                          >
                            {r.title}
                            {r.url
                              ? <ExternalLink size={11} className="opacity-50" />
                              : <Search size={11} className="opacity-50" />
                            }
                          </a>
                          <span className="text-xs text-[var(--text-muted)] ml-1">
                            · {r.platform} · {r.cost}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Deliverable */}
                <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">
                    Deliverable
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {milestone.deliverable}
                  </p>
                </div>

                {/* Mark complete */}
                <Button
                  variant={isCompleted ? "secondary" : "primary"}
                  size="sm"
                  onClick={onToggleComplete}
                >
                  {isCompleted ? "Mark Incomplete" : "Mark Complete"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function RoadmapView({ roadmap, role }: RoadmapViewProps) {
  const { completed, toggle, count, total } = useProgress(
    role,
    roadmap.milestones.length
  );
  const progressPct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--text-secondary)]">
            {count} / {total} milestones complete
          </span>
          <span className="font-mono text-[var(--text-muted)]">
            {progressPct}%
          </span>
        </div>
        <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--color-present)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div>
        {roadmap.milestones.map((m, i) => (
          <MilestoneCard
            key={m.week}
            milestone={m}
            index={i}
            isCompleted={completed.has(m.week)}
            onToggleComplete={() => toggle(m.week)}
          />
        ))}
      </div>

      {/* Final project card */}
      {roadmap.final_project_idea && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: roadmap.milestones.length * 0.08 + 0.1 }}
          className="mt-2 px-5 py-5 rounded-[var(--radius-lg)] border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20"
        >
          <p className="text-xs font-mono text-amber-600 uppercase tracking-wide mb-2">
            Final Project
          </p>
          <p className="font-serif text-base text-[var(--text-primary)]">
            {roadmap.final_project_idea}
          </p>
        </motion.div>
      )}
    </div>
  );
}
