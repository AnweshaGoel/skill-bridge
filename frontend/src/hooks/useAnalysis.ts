import { useState } from "react";
import { api } from "../api/client";
import type { GapAnalysisResponse } from "../types";

interface GapInput {
  resumeText: string;
  targetRole: string;
  experienceLevel: string;
}

export function useAnalysis() {
  const [data, setData] = useState<GapAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run({ resumeText, targetRole, experienceLevel }: GapInput) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.gapAnalysis({
        resume_text: resumeText,
        target_role: targetRole,
        experience_level: experienceLevel,
      });
      setData(result);
    } catch (e: unknown) {
      const detail =
        (e as { detail?: string })?.detail ??
        "Analysis failed. Please try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, run };
}
