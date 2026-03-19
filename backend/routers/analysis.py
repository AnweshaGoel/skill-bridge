from fastapi import APIRouter

from models.schemas import GapAnalysisRequest, GapAnalysisResponse
from services.fallback import gap_analysis_fallback
from services.gemini import call_with_fallback

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

_GAP_PROMPT = """\
You are a senior career advisor performing a precise skill gap analysis.

Target role: {target_role}
Experience level: {experience_level}

Compare the candidate's resume against typical industry requirements for the target role.
For every skill the candidate HAS, quote the exact evidence from the resume.

Return ONLY valid JSON — no prose, no markdown fences — with this exact shape:
{{
  "match_score": 65,
  "skills": [
    {{
      "skill": "Python",
      "category": "technical",
      "status": "present",
      "importance": "critical",
      "user_evidence": "exact quote from resume, or null if missing"
    }}
  ],
  "summary": "2-3 sentence honest assessment of the candidate's readiness",
  "top_missing": ["Skill1", "Skill2", "Skill3"]
}}

Rules:
- match_score: integer 0–100 reflecting overall fit
- status: "present" | "missing" | "partial" (partial = mentioned but at low depth)
- importance: "critical" | "important" | "nice-to-have"
- top_missing: the 3–5 most impactful gaps, ordered by importance
- Cover at least 8 skills relevant to {target_role}

Resume:
---
{resume_text}
---
"""


@router.post("/gap", response_model=GapAnalysisResponse)
async def gap_analysis(req: GapAnalysisRequest):
    """Compare resume skills against a target role and return a scored gap analysis."""
    prompt = _GAP_PROMPT.format(
        target_role=req.target_role,
        experience_level=req.experience_level,
        resume_text=req.resume_text,
    )
    result, used_fallback = call_with_fallback(
        primary="pro",
        secondary="flash",
        prompt=prompt,
        rule_fallback_fn=gap_analysis_fallback,
        resume_text=req.resume_text,
        target_role=req.target_role,
    )

    result.pop("used_fallback", None)
    result["target_role"] = req.target_role  # router owns this field; AI doesn't need to echo it
    return GapAnalysisResponse(**result, used_fallback=used_fallback)
