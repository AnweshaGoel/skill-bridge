// Typed fetch wrappers for all backend endpoints
import type {
  ResumeParseResponse,
  GapAnalysisResponse,
  RoadmapResponse,
  InterviewResponse,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw err;
  }
  return res.json() as Promise<T>;
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  // Do not set Content-Type — browser sets it automatically with the boundary
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw err;
  }
  return res.json() as Promise<T>;
}

export const api = {
  parseResume(payload: { text?: string; file?: File }): Promise<ResumeParseResponse> {
    const form = new FormData();
    if (payload.file) {
      form.append("file", payload.file);
    } else if (payload.text) {
      form.append("text", payload.text);
    }
    return postForm<ResumeParseResponse>("/api/resume/parse", form);
  },

  gapAnalysis(payload: {
    resume_text: string;
    target_role: string;
    experience_level?: string;
  }): Promise<GapAnalysisResponse> {
    return post<GapAnalysisResponse>("/api/analysis/gap", payload);
  },

  generateRoadmap(payload: {
    target_role: string;
    missing_skills: string[];
    available_hours_per_week?: number;
  }): Promise<RoadmapResponse> {
    return post<RoadmapResponse>("/api/roadmap/generate", payload);
  },

  getInterviewQuestions(payload: {
    target_role: string;
    missing_skills: string[];
    experience_level?: string;
  }): Promise<InterviewResponse> {
    return post<InterviewResponse>("/api/interview/questions", payload);
  },
};
