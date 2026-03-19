from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# ── Resume ───────────────────────────────────────────────────────────────────

class ResumeParseRequest(BaseModel):
    text: str = Field(..., min_length=50, max_length=8000, description="Raw resume text")

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()


class Skill(BaseModel):
    name: str
    category: str  # "technical" | "soft" | "tool" | "certification"
    confidence: float = Field(..., ge=0.0, le=1.0)
    source: str = Field(default="ai")  # "ai" | "fallback"


class ResumeParseResponse(BaseModel):
    skills: List[Skill]
    years_experience: Optional[int] = Field(default=None, ge=0, le=60)
    education_level: Optional[str] = None
    raw_summary: str
    resume_text: str  # full extracted text, passed downstream to gap analysis
    used_fallback: bool


# ── Gap Analysis ─────────────────────────────────────────────────────────────

class GapAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=50, max_length=8000)
    target_role: str = Field(..., min_length=2, max_length=100)
    experience_level: str = Field(default="entry")  # "entry" | "mid" | "senior"

    @field_validator("resume_text", "target_role")
    @classmethod
    def strip_fields(cls, v: str) -> str:
        return v.strip()

    @field_validator("experience_level")
    @classmethod
    def validate_experience_level(cls, v: str) -> str:
        allowed = {"entry", "mid", "senior"}
        if v not in allowed:
            raise ValueError(f"experience_level must be one of {allowed}")
        return v


class SkillGap(BaseModel):
    skill: str
    category: str
    status: str   # "present" | "missing" | "partial"
    importance: str  # "critical" | "important" | "nice-to-have"
    user_evidence: Optional[str] = None  # direct quote from resume


class GapAnalysisResponse(BaseModel):
    target_role: str
    match_score: int = Field(..., ge=0, le=100)
    skills: List[SkillGap]
    summary: str
    top_missing: List[str] = Field(default_factory=list)
    used_fallback: bool


# ── Roadmap ──────────────────────────────────────────────────────────────────

class RoadmapRequest(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=100)
    missing_skills: List[str] = Field(..., min_length=0)
    available_hours_per_week: int = Field(default=10, ge=1, le=80)
    budget: str = Field(default="free")  # "free" | "paid"

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, v: str) -> str:
        allowed = {"free", "paid"}
        if v not in allowed:
            raise ValueError(f"budget must be one of {allowed}")
        return v

    @field_validator("missing_skills")
    @classmethod
    def strip_skills(cls, v: List[str]) -> List[str]:
        return [s.strip() for s in v if s.strip()]


class Course(BaseModel):
    title: str
    platform: str
    url: Optional[str] = None
    duration_hours: int = Field(..., ge=0)
    cost: str  # "Free" | "$X"
    skills_taught: List[str]


class Milestone(BaseModel):
    week: int = Field(..., ge=1)
    title: str
    description: str
    skills: List[str]
    resources: List[Course]
    deliverable: str


class RoadmapResponse(BaseModel):
    total_weeks: int = Field(..., ge=0)
    milestones: List[Milestone]
    final_project_idea: str
    used_fallback: bool


# ── Mock Interview ───────────────────────────────────────────────────────────

class InterviewRequest(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=100)
    missing_skills: List[str]
    experience_level: str = Field(default="entry")

    @field_validator("experience_level")
    @classmethod
    def validate_experience_level(cls, v: str) -> str:
        allowed = {"entry", "mid", "senior"}
        if v not in allowed:
            raise ValueError(f"experience_level must be one of {allowed}")
        return v

    @field_validator("missing_skills")
    @classmethod
    def strip_skills(cls, v: List[str]) -> List[str]:
        return [s.strip() for s in v if s.strip()]


class InterviewQuestion(BaseModel):
    question: str
    category: str   # "technical" | "behavioral" | "system-design"
    skill_tested: str
    hint: Optional[str] = None
    difficulty: str  # "easy" | "medium" | "hard"


class InterviewResponse(BaseModel):
    questions: List[InterviewQuestion]
    used_fallback: bool


# ── Shared error response ────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
    code: str  # "VALIDATION_ERROR" | "AI_UNAVAILABLE" | "PARSE_FAILED"
    used_fallback: bool = False
