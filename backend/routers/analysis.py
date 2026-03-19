from fastapi import APIRouter

from models.schemas import GapAnalysisRequest, GapAnalysisResponse, SkillGap

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/gap", response_model=GapAnalysisResponse)
async def gap_analysis(req: GapAnalysisRequest):
    """Compare resume skills against a target role and return a gap analysis."""
    # Stub response — real analysis implemented with the AI service
    return GapAnalysisResponse(
        target_role=req.target_role,
        match_score=42,
        skills=[
            SkillGap(
                skill="Docker",
                category="tool",
                status="missing",
                importance="critical",
                user_evidence=None,
            ),
            SkillGap(
                skill="Python",
                category="technical",
                status="present",
                importance="critical",
                user_evidence="Mentioned Python in projects section.",
            ),
            SkillGap(
                skill="Kubernetes",
                category="tool",
                status="missing",
                importance="important",
                user_evidence=None,
            ),
        ],
        summary="Stub response — AI gap analysis not yet wired up.",
        top_missing=["Docker", "Kubernetes"],
        used_fallback=False,
    )
