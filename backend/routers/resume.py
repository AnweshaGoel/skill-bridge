import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from models.schemas import ResumeParseResponse, Skill
from services.pdf_parser import extract_text_from_pdf

router = APIRouter(prefix="/api/resume", tags=["resume"])

_DATA_DIR = Path(__file__).parent.parent / "data"
_MAX_PDF_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(
    file: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None),
):
    """Accept a PDF upload OR pasted resume text, return extracted skills."""
    if file is not None:
        if file.content_type != "application/pdf":
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are accepted.",
            )
        raw = await file.read()
        if len(raw) > _MAX_PDF_BYTES:
            raise HTTPException(
                status_code=400,
                detail="File exceeds the 5 MB limit.",
            )
        resume_text = extract_text_from_pdf(raw)
    elif text is not None:
        resume_text = text.strip()
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either a PDF file or resume text.",
        )

    if len(resume_text) < 50:
        raise HTTPException(
            status_code=422,
            detail="Resume text is too short (minimum 50 characters).",
        )

    # Cap at 8 000 chars to prevent prompt abuse
    resume_text = resume_text[:8000]

    # Stub response — real extraction implemented with the AI service
    return ResumeParseResponse(
        skills=[
            Skill(name="Python", category="technical", confidence=0.9, source="ai"),
            Skill(name="Git", category="tool", confidence=0.85, source="ai"),
            Skill(name="SQL", category="technical", confidence=0.75, source="ai"),
        ],
        years_experience=1,
        education_level="Bachelor's",
        raw_summary="Stub response — AI extraction not yet wired up.",
        used_fallback=False,
    )


@router.get("/samples")
async def list_samples():
    """Return sample resume IDs available for demo mode."""
    data_file = _DATA_DIR / "sample_resumes.json"
    resumes = json.loads(data_file.read_text(encoding="utf-8"))
    return [
        {"id": r["id"], "name": r["name"], "role_applying_for": r["role_applying_for"]}
        for r in resumes
    ]
