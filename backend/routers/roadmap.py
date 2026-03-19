from fastapi import APIRouter

from models.schemas import RoadmapRequest, RoadmapResponse
from services.fallback import roadmap_fallback
from services.gemini import call_with_fallback

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

_ROADMAP_PROMPT = """\
You are an expert learning path designer. Create a concrete, week-by-week roadmap \
to help someone become a {target_role}.

Constraints:
- Available hours per week: {hours_per_week}
- Budget: {budget} (free = only free resources; paid = paid courses acceptable)
- Skills to address: {missing_skills}

Every resource MUST be real — use actual course titles, platforms, and URLs you are \
certain exist. Every milestone MUST have a concrete, testable deliverable.

Return ONLY valid JSON — no prose, no markdown fences — with this exact shape:
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
          "title": "Exact course title",
          "platform": "Platform name",
          "url": "https://real-url.com",
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
- total_weeks must reflect {hours_per_week} hrs/week — less time per week means more weeks
- Group related skills into the same milestone where logical
- Each milestone covers 1–3 weeks, no more
- Roadmap must cover ALL skills listed in missing_skills
"""


@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap(req: RoadmapRequest):
    """Generate a personalised week-by-week learning roadmap."""
    if not req.missing_skills:
        return RoadmapResponse(
            total_weeks=0,
            milestones=[],
            final_project_idea="No skill gaps identified — you're ready to apply!",
            used_fallback=False,
        )

    prompt = _ROADMAP_PROMPT.format(
        target_role=req.target_role,
        hours_per_week=req.available_hours_per_week,
        budget=req.budget,
        missing_skills=", ".join(req.missing_skills),
    )
    result, used_fallback = call_with_fallback(
        primary="flash",
        secondary="lite",
        prompt=prompt,
        rule_fallback_fn=roadmap_fallback,
        target_role=req.target_role,
        missing_skills=req.missing_skills,
    )

    result.pop("used_fallback", None)
    return RoadmapResponse(**result, used_fallback=used_fallback)
