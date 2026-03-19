import { useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { useAnalysis } from "../hooks/useAnalysis";
import { SkillGapChart } from "../components/SkillGapChart";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import type { ResumeParseResponse } from "../types";

interface LocationState {
  resumeData: ResumeParseResponse;
  resumeText: string;
  targetRole: string;
  experienceLevel: string;
}

export default function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const { data: gapData, loading, error, run } = useAnalysis();
  const called = useRef(false);

  useEffect(() => {
    if (!state?.targetRole || called.current) return;
    called.current = true;
    run({
      resumeText: state.resumeText,
      targetRole: state.targetRole,
      experienceLevel: state.experienceLevel,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state?.targetRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            No analysis data found.
          </p>
          <Link to="/" className="text-sm underline text-[var(--text-muted)]">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pt-16 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-6 font-mono">
        <Link to="/" className="hover:text-[var(--text-primary)]">
          Home
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--text-primary)]">Analysis</span>
      </nav>

      <h2 className="text-3xl font-serif mb-1">Skill Gap Analysis</h2>
      <p className="text-[var(--text-secondary)] mb-8">
        Target:{" "}
        <span className="text-[var(--text-primary)] font-medium">
          {state.targetRole}
        </span>
      </p>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner size="lg" />
          <p className="text-[var(--text-secondary)] text-sm">
            Analysing your resume with AI…
          </p>
          <div className="w-full max-w-2xl space-y-3 mt-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] animate-pulse"
                style={{ width: `${70 + i * 6}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-[var(--color-missing)] bg-[var(--color-missing-bg)] mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-[var(--color-missing)] flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-missing)]">
                Analysis failed
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {error}
              </p>
              <button
                onClick={() =>
                  run({
                    resumeText: state.resumeText,
                    targetRole: state.targetRole,
                    experienceLevel: state.experienceLevel,
                  })
                }
                className="text-xs underline mt-2 text-[var(--text-muted)]"
              >
                Retry
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {gapData && !loading && (
        <>
          {gapData.used_fallback && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-fallback-bg)] border border-[var(--color-fallback)] text-[var(--color-fallback)] text-xs font-mono mb-6">
              <Badge variant="fallback">offline mode</Badge>
              <span>AI unavailable — showing rule-based analysis</span>
            </div>
          )}

          <div className="flex gap-8 items-start">
            {/* Left 40%: chart + score */}
            <div style={{ width: "40%" }}>
              <Card padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif">Match Score</h3>
                  <span className="text-3xl font-mono font-medium">
                    {gapData.match_score}%
                  </span>
                </div>
                <SkillGapChart skills={gapData.skills} />
              </Card>
            </div>

            {/* Right 60%: grouped skill lists */}
            <div className="flex-1 space-y-6">
              {/* Missing — most prominent */}
              {gapData.skills.filter((s) => s.status === "missing").length >
                0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-missing)] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-missing)] inline-block" />
                    Missing Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {gapData.skills
                      .filter((s) => s.status === "missing")
                      .map((s) => (
                        <Badge key={s.skill} variant="missing">
                          {s.skill}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Partial */}
              {gapData.skills.filter((s) => s.status === "partial").length >
                0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-partial)] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-partial)] inline-block" />
                    Partial / Basic
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {gapData.skills
                      .filter((s) => s.status === "partial")
                      .map((s) => (
                        <Badge key={s.skill} variant="partial">
                          {s.skill}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Present */}
              {gapData.skills.filter((s) => s.status === "present").length >
                0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-present)] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-present)] inline-block" />
                    Skills You Have
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {gapData.skills
                      .filter((s) => s.status === "present")
                      .map((s) => (
                        <Badge key={s.skill} variant="present">
                          {s.skill}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* AI summary */}
              <Card
                padding="sm"
                className="bg-[var(--bg-secondary)] border-[var(--border)]"
              >
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {gapData.summary}
                </p>
              </Card>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3 mt-10">
            <Button
              size="lg"
              onClick={() =>
                navigate("/roadmap", {
                  state: {
                    targetRole: state.targetRole,
                    experienceLevel: state.experienceLevel,
                    missingSkills: gapData.top_missing,
                    resumeText: state.resumeText,
                  },
                })
              }
              disabled={gapData.top_missing.length === 0}
            >
              Generate Roadmap →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                navigate("/roadmap", {
                  state: {
                    targetRole: state.targetRole,
                    experienceLevel: state.experienceLevel,
                    missingSkills: gapData.top_missing,
                    resumeText: state.resumeText,
                    scrollToInterview: true,
                  },
                })
              }
            >
              Mock Interview
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
