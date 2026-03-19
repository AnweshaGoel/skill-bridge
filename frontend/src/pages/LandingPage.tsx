import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export default function LandingPage() {
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const navigate = useNavigate();

  const pasteReady = inputMode === "paste" && resumeText.trim().length >= 50;
  const canAnalyse = targetRole.trim().length > 0 && pasteReady;

  function handleAnalyse() {
    navigate("/analysis", { state: { resumeText, targetRole, experienceLevel } });
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
          {/* Mode toggle */}
          <div className="flex gap-2 mb-5">
            {(["paste", "upload"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                  inputMode === mode
                    ? "bg-[var(--bg-accent)] text-[var(--bg-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                {mode === "paste" ? (
                  <FileText size={14} />
                ) : (
                  <Upload size={14} />
                )}
                {mode === "paste" ? "Paste Text" : "Upload PDF"}
              </button>
            ))}
          </div>

          {/* Resume input */}
          {inputMode === "paste" ? (
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here (minimum 50 characters)..."
              className="w-full h-48 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:border-[var(--border-strong)] transition-colors placeholder:text-[var(--text-muted)]"
            />
          ) : (
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--bg-secondary)]">
              <div className="text-center text-[var(--text-muted)]">
                <Upload size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Drag & drop your PDF, or click to browse</p>
                <p className="text-xs mt-1 opacity-60">
                  PDF upload activates in the next step
                </p>
              </div>
            </div>
          )}

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
              <option value="staff">Staff / Principal</option>
            </select>
          </div>

          {/* CTA row */}
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              {inputMode === "paste" &&
              resumeText.length > 0 &&
              resumeText.length < 50
                ? `${50 - resumeText.length} more characters needed`
                : "\u00a0"}
            </p>
            <Button size="lg" onClick={handleAnalyse} disabled={!canAnalyse}>
              Analyse My Skills
              <ArrowRight size={16} />
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
