import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";
import { RoadmapView } from "../components/RoadmapView";
import { InterviewPanel } from "../components/InterviewPanel";
import { Spinner } from "../components/ui/Spinner";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { api } from "../api/client";
import type { RoadmapResponse, InterviewResponse } from "../types";

interface LocationState {
  targetRole: string;
  experienceLevel: string;
  missingSkills: string[];
  resumeText: string;
  scrollToInterview?: boolean;
}

export default function RoadmapPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const interviewRef = useRef<HTMLDivElement>(null);

  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [interview, setInterview] = useState<InterviewResponse | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const called = useRef(false);

  async function loadRoadmap() {
    if (!state) return;
    setRoadmapLoading(true);
    setRoadmapError(null);
    try {
      const result = await api.generateRoadmap({
        target_role: state.targetRole,
        missing_skills: state.missingSkills,
      });
      setRoadmap(result);
      // Persist roadmap so user can refresh without re-calling
      try {
        localStorage.setItem(
          `roadmap-data-${state.targetRole}`,
          JSON.stringify(result)
        );
      } catch {
        // localStorage quota exceeded — continue without caching
      }
    } catch (e: unknown) {
      setRoadmapError(
        (e as { detail?: string })?.detail ?? "Failed to generate roadmap."
      );
    } finally {
      setRoadmapLoading(false);
    }
  }

  async function loadInterview() {
    if (!state) return;
    setInterviewLoading(true);
    setInterviewError(null);
    try {
      const result = await api.getInterviewQuestions({
        target_role: state.targetRole,
        missing_skills: state.missingSkills,
        experience_level: state.experienceLevel,
      });
      setInterview(result);
    } catch (e: unknown) {
      setInterviewError(
        (e as { detail?: string })?.detail ??
          "Failed to generate interview questions."
      );
    } finally {
      setInterviewLoading(false);
    }
  }

  useEffect(() => {
    if (!state?.targetRole || called.current) return;
    called.current = true;

    // Try to restore cached roadmap first
    try {
      const cached = localStorage.getItem(`roadmap-data-${state.targetRole}`);
      if (cached) {
        setRoadmap(JSON.parse(cached) as RoadmapResponse);
      } else {
        loadRoadmap();
      }
    } catch {
      loadRoadmap();
    }

    // Interview always fetches fresh
    loadInterview();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to interview section if navigated from "Mock Interview" CTA
  useEffect(() => {
    if (state?.scrollToInterview && interviewRef.current && interview) {
      interviewRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [interview, state?.scrollToInterview]);

  if (!state?.targetRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            No roadmap data found.
          </p>
          <Link to="/" className="text-sm underline text-[var(--text-muted)]">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pb-20">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border)] py-3 mb-8">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-1 text-xs text-[var(--text-muted)] font-mono">
            <Link to="/" className="hover:text-[var(--text-primary)]">
              Home
            </Link>
            <ChevronRight size={12} />
            <Link to="/analysis" className="hover:text-[var(--text-primary)]">
              Analysis
            </Link>
            <ChevronRight size={12} />
            <span className="text-[var(--text-primary)]">Roadmap</span>
          </nav>

          {/* Regenerate */}
          {confirmRegenerate ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--text-muted)]">Regenerate roadmap?</span>
              <button
                onClick={() => {
                  setConfirmRegenerate(false);
                  loadRoadmap();
                }}
                className="text-[var(--color-missing)] underline"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmRegenerate(false)}
                className="text-[var(--text-muted)] underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmRegenerate(true)}
              disabled={roadmapLoading}
            >
              <RefreshCw size={13} />
              Regenerate
            </Button>
          )}
        </div>
        <div className="mt-1">
          <h1 className="text-lg font-serif">{state.targetRole}</h1>
        </div>
      </div>

      {/* Roadmap section */}
      <section className="mb-16">
        <h2 className="text-2xl font-serif mb-6">Learning Roadmap</h2>

        {roadmapLoading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-[var(--text-secondary)]">
              Building your personalised roadmap…
            </p>
            <div className="w-full space-y-3 mt-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {roadmapError && !roadmapLoading && (
          <Card className="border-[var(--color-missing)] bg-[var(--color-missing-bg)] mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="text-[var(--color-missing)] flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-[var(--color-missing)]">
                  Failed to generate roadmap
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {roadmapError}
                </p>
                <button
                  onClick={loadRoadmap}
                  className="text-xs underline mt-2 text-[var(--text-muted)]"
                >
                  Retry
                </button>
              </div>
            </div>
          </Card>
        )}

        {roadmap && !roadmapLoading && (
          <>
            {roadmap.used_fallback && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-fallback-bg)] border border-[var(--color-fallback)] text-[var(--color-fallback)] text-xs font-mono mb-6">
                <Badge variant="fallback">offline mode</Badge>
                <span>AI unavailable — showing template roadmap</span>
              </div>
            )}
            <RoadmapView roadmap={roadmap} role={state.targetRole} />
          </>
        )}
      </section>

      {/* Interview section */}
      <section ref={interviewRef}>
        {interviewLoading && (
          <div className="flex items-center gap-3 py-8">
            <Spinner size="md" />
            <p className="text-sm text-[var(--text-secondary)]">
              Generating interview questions…
            </p>
          </div>
        )}

        {interviewError && !interviewLoading && (
          <Card className="border-[var(--color-missing)] bg-[var(--color-missing-bg)] mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="text-[var(--color-missing)] flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-[var(--color-missing)]">
                  Failed to generate questions
                </p>
                <button
                  onClick={loadInterview}
                  className="text-xs underline mt-2 text-[var(--text-muted)]"
                >
                  Retry
                </button>
              </div>
            </div>
          </Card>
        )}

        {interview && !interviewLoading && (
          <InterviewPanel
            interview={interview}
            onRegenerate={loadInterview}
            regenerating={interviewLoading}
          />
        )}
      </section>
    </div>
  );
}
