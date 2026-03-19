// TypeScript interfaces mirroring the backend Pydantic models

export interface Skill {
  name: string;
  category: string;
  confidence: number;
  source: "ai" | "fallback";
}

export interface ResumeParseResponse {
  skills: Skill[];
  years_experience: number | null;
  education_level: string | null;
  raw_summary: string;
  resume_text: string;
  used_fallback: boolean;
}

export interface SkillGap {
  skill: string;
  category: string;
  status: "present" | "missing" | "partial";
  importance: "critical" | "important" | "nice-to-have";
  user_evidence: string | null;
}

export interface GapAnalysisResponse {
  target_role: string;
  match_score: number;
  skills: SkillGap[];
  summary: string;
  top_missing: string[];
  used_fallback: boolean;
}

export interface Course {
  title: string;
  platform: string;
  url: string | null;
  duration_hours: number;
  cost: string;
  skills_taught: string[];
}

export interface Milestone {
  week: number;
  title: string;
  description: string;
  skills: string[];
  resources: Course[];
  deliverable: string;
}

export interface RoadmapResponse {
  total_weeks: number;
  milestones: Milestone[];
  final_project_idea: string;
  used_fallback: boolean;
}

export interface InterviewQuestion {
  question: string;
  category: "technical" | "behavioral" | "system-design";
  skill_tested: string;
  hint: string | null;
  difficulty: "easy" | "medium" | "hard";
}

export interface InterviewResponse {
  questions: InterviewQuestion[];
  used_fallback: boolean;
}

export interface ApiError {
  detail: string;
  code: "VALIDATION_ERROR" | "AI_UNAVAILABLE" | "PARSE_FAILED";
  used_fallback: boolean;
}
