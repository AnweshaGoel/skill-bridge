import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ResumeUploader } from "../components/ResumeUploader";
import { api } from "../api/client";

const CONSENT_KEY = "skill-bridge-consent-accepted";

function ConsentModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative max-w-md w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={18} className="text-[var(--color-partial)] flex-shrink-0" />
          <h2 className="font-serif text-lg text-[var(--text-primary)]">Before you continue</h2>
        </div>

        <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
          <p>
            <span className="text-[var(--text-primary)] font-medium">We don't store your data.</span>{" "}
            Your resume and target role are processed in real time and never saved to any database.
          </p>
          <p>
            However, this app uses the <span className="font-medium text-[var(--text-primary)]">Google Gemini API</span> to
            analyse your resume. By using Gemini, your input may be used by Google to improve their
            AI models in accordance with the{" "}
            <a
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-[var(--text-primary)] hover:opacity-70 transition-opacity"
            >
              Gemini API Terms of Service
            </a>
            .
          </p>
          <p>
            Do not include sensitive personal information such as ID numbers, financial data,
            or medical details in your resume.
          </p>
        </div>

        <Button className="w-full mt-6" size="lg" onClick={onAccept}>
          I understand — continue
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(
    () => localStorage.getItem(CONSENT_KEY) === "true"
  );
  const [showConsent, setShowConsent] = useState(false);
  const navigate = useNavigate();
  const hasInput = mode === "paste" ? text.trim().length >= 50 : file !== null;
  const canAnalyse = hasInput && targetRole.trim().length > 0;

  function handleAcceptConsent() {
    localStorage.setItem(CONSENT_KEY, "true");
    setConsentGiven(true);
    setShowConsent(false);
    runAnalyse();
  }

  // Track chars remaining for paste mode hint
  const charsLeft =
    mode === "paste" && text.length > 0 && text.length < 50
      ? 50 - text.length
      : null;

  function handleAnalyse() {
    if (!canAnalyse) return;
    if (!consentGiven) {
      setShowConsent(true);
      return;
    }
    runAnalyse();
  }

  async function runAnalyse() {
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
      {showConsent && <ConsentModal onAccept={handleAcceptConsent} />}
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

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
        {/* Hero */}
        <section className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs font-mono mb-6">
            AI-powered · fallback-safe · no login required
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif mb-4 sm:mb-5 leading-tight">
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
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
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
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 sm:mt-10">
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
