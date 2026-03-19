import logging

from fastapi import APIRouter, Request

from limiter import limiter

logger = logging.getLogger(__name__)
from models.schemas import RoadmapRequest, RoadmapResponse
from services.fallback import roadmap_fallback
from services.gemini import call_with_fallback
from services.sanitize import sanitize_text

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

_ROADMAP_PROMPT = """\
You are an expert learning path designer. Create a concrete, week-by-week roadmap \
to help someone become a {target_role}.

Constraints:
- Available hours per week: {hours_per_week}
- Skills to address: {missing_skills}

For each resource include the best real course or resource title and its platform \
(e.g. "Coursera", "YouTube", "Udemy", "official docs"). \
Set "url" to null — links are generated automatically from the title and platform.

Every milestone must have a concrete, testable deliverable.

Return ONLY valid JSON — no prose, no markdown fences — matching this shape exactly:
{{
  "total_weeks": 12,
  "milestones": [
    {{
      "week": 1,
      "title": "Short milestone title",
      "description": "What the learner will study and practise this milestone",
      "skills": ["Skill1"],
      "resources": [
        {{
          "title": "Exact course or resource title",
          "platform": "Platform name",
          "url": null,
          "duration_hours": 6,
          "cost": "Free",
          "skills_taught": ["Skill1"]
        }}
      ],
      "deliverable": "Specific, verifiable thing to build or demonstrate"
    }}
  ],
  "final_project_idea": "Capstone project that combines all skills above"
}}

Rules:
- total_weeks must reflect {hours_per_week} hrs/week — less time means more weeks
- Group related skills into the same milestone where logical
- Each milestone covers 1–3 weeks maximum
- Roadmap must address ALL skills in the missing_skills list
"""


@router.post("/generate", response_model=RoadmapResponse)
@limiter.limit("10/minute")
async def generate_roadmap(request: Request, req: RoadmapRequest):
    """Generate a personalised week-by-week learning roadmap."""
    if not req.missing_skills:
        logger.info("Roadmap skipped: no missing skills for role=%r", req.target_role)
        return RoadmapResponse(
            total_weeks=0,
            milestones=[],
            final_project_idea="No skill gaps identified — you're ready to apply!",
            used_fallback=False,
        )

    target_role = sanitize_text(req.target_role, max_length=100)
    # Sanitize each skill name (max 60 chars each)
    missing_skills = [sanitize_text(s, max_length=60) for s in req.missing_skills]
    logger.info(
        "Roadmap generation: role=%r skills=%d hours/week=%s",
        target_role, len(missing_skills), req.available_hours_per_week,
    )

    prompt = _ROADMAP_PROMPT.format(
        target_role=target_role,
        hours_per_week=req.available_hours_per_week,
        missing_skills=", ".join(missing_skills),
    )
    result, used_fallback = call_with_fallback(
        primary="flash",
        secondary="lite",
        prompt=prompt,
        rule_fallback_fn=roadmap_fallback,
        target_role=target_role,
        missing_skills=missing_skills,
    )

    result.pop("used_fallback", None)
    logger.info(
        "Roadmap done: role=%r weeks=%s milestones=%d fallback=%s",
        target_role, result.get("total_weeks"), len(result.get("milestones", [])), used_fallback,
    )
    return RoadmapResponse(**result, used_fallback=used_fallback)
