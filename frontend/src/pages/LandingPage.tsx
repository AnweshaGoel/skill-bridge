import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ResumeUploader } from "../components/ResumeUploader";
import { api } from "../api/client";

export default function LandingPage() {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const hasInput = mode === "paste" ? text.trim().length >= 50 : file !== null;
  const canAnalyse = hasInput && targetRole.trim().length > 0;

  // Track chars remaining for paste mode hint
  const charsLeft =
    mode === "paste" && text.length > 0 && text.length < 50
      ? 50 - text.length
      : null;

  async function handleAnalyse() {
    if (!canAnalyse) return;
    setLoading(true);
    setError(null);
    try {
      const resumeData = await api.parseResume({
        text: mode === "paste" ? text : undefined,
        file: mode === "upload" ? (file ?? undefined) : undefined,
      });
      navigate("/analysis", {
        state: {
          resumeData,
          resumeText: resumeData.resume_text,
          targetRole: targetRole.trim(),
          experienceLevel,
        },
      });
    } catch (e: unknown) {
      const detail =
        (e as { detail?: string })?.detail ??
        "Failed to parse resume. Please try again.";
      setError(detail);
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border-strong) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.35,
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-20">
        {/* Hero */}
        <section className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs font-mono mb-6">
            AI-powered · fallback-safe · no login required
          </div>
          <h1 className="text-5xl md:text-6xl font-serif mb-5 leading-tight">
            Find the gap.
            <br />
            <em>Close the gap.</em>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto leading-relaxed">
            Paste your resume and a target role — get a precise skill gap
            analysis and a concrete learning roadmap in seconds.
          </p>
        </section>

        {/* Input card */}
        <Card padding="lg" className="shadow-sm">
          <ResumeUploader
            mode={mode}
            onModeChange={setMode}
            text={text}
            onTextChange={setText}
            file={file}
            onFileChange={setFile}
          />

          {/* Role + experience row */}
          <div className="flex gap-3 mt-4">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target role — e.g. Cloud Engineer"
              className="flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--border-strong)] transition-colors placeholder:text-[var(--text-muted)]"
            />
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--border-strong)] transition-colors"
            >
              <option value="entry">Entry level</option>
              <option value="mid">Mid level</option>
              <option value="senior">Senior</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="mt-3 text-xs text-[var(--color-missing)]">{error}</p>
          )}

          {/* CTA row */}
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              {charsLeft !== null
                ? `${charsLeft} more characters needed`
                : "\u00a0"}
            </p>
            <Button
              size="lg"
              onClick={handleAnalyse}
              disabled={!canAnalyse || loading}
              loading={loading}
            >
              {loading ? "Parsing resume…" : "Analyse My Skills"}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </div>
        </Card>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {[
            {
              label: "Skill Gap Analysis",
              desc: "See exactly what you're missing vs the role",
            },
            {
              label: "Learning Roadmap",
              desc: "A week-by-week plan with real courses",
            },
            {
              label: "Mock Interviews",
              desc: "AI questions tailored to your specific gaps",
            },
          ].map(({ label, desc }) => (
            <div
              key={label}
              className="text-center px-4 py-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]"
            >
              <p className="font-medium text-sm text-[var(--text-primary)] mb-1">
                {label}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
