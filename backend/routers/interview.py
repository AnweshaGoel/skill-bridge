from fastapi import APIRouter

router = APIRouter(prefix="/api/interview", tags=["interview"])


@router.post("/questions")
async def get_questions():
    return {"questions": [], "used_fallback": False}
