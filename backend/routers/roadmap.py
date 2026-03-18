from fastapi import APIRouter

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


@router.post("/generate")
async def generate_roadmap():
    return {"total_weeks": 0, "milestones": [], "used_fallback": False}
