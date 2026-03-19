from fastapi import APIRouter

from models.schemas import InterviewRequest, InterviewResponse
from services.fallback import interview_fallback
from services.gemini import call_with_fallback

router = APIRouter(prefix="/api/interview", tags=["interview"])

_INTERVIEW_PROMPT = """\
You are an expert technical interviewer at a top-tier tech company. \
Generate mock interview questions for a {experience_level}-level {target_role} candidate.

Skills to probe (the candidate is weak in these): {missing_skills}

Question mix — produce EXACTLY:
- 4 technical questions (test depth of knowledge in the missing skills)
- 3 behavioural questions (STAR-format situations; role-relevant)
- 3 system-design questions (architecture, scalability, trade-offs)

Be specific and probing, not generic. Avoid questions like "What is Docker?" — \
instead ask "Your team's container image is 3 GB and pulling it takes 4 minutes in CI. \
Walk me through how you would diagnose and fix this."

Return ONLY valid JSON — no prose, no markdown fences — with this exact shape:
{{
  "questions": [
    {{
      "question": "The full question text",
      "category": "technical",
      "skill_tested": "Docker",
      "hint": "What a strong answer should address, or null",
      "difficulty": "easy|medium|hard"
    }}
  ]
}}
"""


@router.post("/questions", response_model=InterviewResponse)
async def get_questions(req: InterviewRequest):
    """Generate targeted mock interview questions for the missing skills."""
    prompt = _INTERVIEW_PROMPT.format(
        experience_level=req.experience_level,
        target_role=req.target_role,
        missing_skills=", ".join(req.missing_skills) if req.missing_skills else "general role skills",
    )
    result, used_fallback = call_with_fallback(
        primary="flash",
        secondary="lite",
        prompt=prompt,
        rule_fallback_fn=interview_fallback,
        target_role=req.target_role,
        missing_skills=req.missing_skills,
    )

    result.pop("used_fallback", None)
    return InterviewResponse(**result, used_fallback=used_fallback)
