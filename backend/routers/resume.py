from fastapi import APIRouter

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/parse")
async def parse_resume():
    return {"skills": [], "used_fallback": False}


@router.get("/samples")
async def list_samples():
    return []
