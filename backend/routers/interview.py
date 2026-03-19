from fastapi import APIRouter, Request

from limiter import limiter
from models.schemas import InterviewRequest, InterviewResponse
from services.fallback import interview_fallback
from services.gemini import call_with_fallback
from services.sanitize import sanitize_text

router = APIRouter(prefix="/api/interview", tags=["interview"])

# Keywords that indicate a technical/engineering role
_TECH_KEYWORDS = {
    "engineer", "developer", "devops", "sre", "architect", "ml", "data scientist",
    "cloud", "backend", "frontend", "fullstack", "platform", "security", "embedded",
}


def _is_technical(role: str) -> bool:
    return any(kw in role.lower() for kw in _TECH_KEYWORDS)


_TECHNICAL_PROMPT = """\
You are an expert technical interviewer at a top-tier tech company. \
Generate mock interview questions for a {experience_level}-level {target_role} candidate.

Skills to probe (the candidate is weak in these): {missing_skills}

Question mix — produce EXACTLY:
- 4 technical questions (test depth of knowledge in the missing skills)
- 3 behavioral questions (STAR-format situations; role-relevant)
- 3 system-design questions (architecture, scalability, trade-offs)

Be specific and probing, not generic. Avoid "What is X?" — \
ask scenario-based questions like "Your container image is 3 GB and CI pulls \
take 4 minutes. Walk me through how you would diagnose and fix this."

Return ONLY valid JSON — no prose, no markdown fences — with this exact shape:
{{
  "questions": [
    {{
      "question": "The full question text",
      "category": "technical",
      "skill_tested": "Skill name",
      "hint": "What a strong answer should cover, or null",
      "difficulty": "easy|medium|hard"
    }}
  ]
}}

category must be exactly one of: "technical", "behavioral", "system-design"
"""

_GENERAL_PROMPT = """\
You are an expert career interviewer. \
Generate mock interview questions for a {experience_level}-level {target_role} candidate.

Areas where the candidate has gaps: {missing_skills}

Question mix — produce EXACTLY:
- 5 role-specific knowledge questions (probe core {target_role} concepts and the gaps above)
- 5 behavioral questions (STAR-format; probe leadership, communication, \
  prioritisation, stakeholder management, and handling failure)

Be specific and situational — tailor every question to the {target_role} context.

Return ONLY valid JSON — no prose, no markdown fences — with this exact shape:
{{
  "questions": [
    {{
      "question": "The full question text",
      "category": "technical",
      "skill_tested": "Skill or competency name",
      "hint": "What a strong answer should cover, or null",
      "difficulty": "easy|medium|hard"
    }}
  ]
}}

category must be exactly one of: "technical", "behavioral"
Use "technical" for role-specific knowledge questions (not only engineering).
"""


@router.post("/questions", response_model=InterviewResponse)
@limiter.limit("10/minute")
async def get_questions(request: Request, req: InterviewRequest):
    """Generate targeted mock interview questions adapted to the role type."""
    target_role = sanitize_text(req.target_role, max_length=100)
    missing_skills = [sanitize_text(s, max_length=60) for s in req.missing_skills]

    prompt_template = _TECHNICAL_PROMPT if _is_technical(target_role) else _GENERAL_PROMPT
    prompt = prompt_template.format(
        experience_level=req.experience_level,
        target_role=target_role,
        missing_skills=", ".join(missing_skills) if missing_skills else "general role skills",
    )
    result, used_fallback = call_with_fallback(
        primary="flash",
        secondary="lite",
        prompt=prompt,
        rule_fallback_fn=interview_fallback,
        target_role=target_role,
        missing_skills=missing_skills,
    )

    result.pop("used_fallback", None)
    return InterviewResponse(**result, used_fallback=used_fallback)
