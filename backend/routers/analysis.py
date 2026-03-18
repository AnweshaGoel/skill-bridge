from fastapi import APIRouter

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/gap")
async def gap_analysis():
    return {"target_role": "", "match_score": 0, "skills": [], "used_fallback": False}
