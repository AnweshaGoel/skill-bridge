import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from models.schemas import ResumeParseResponse, Skill
from services.fallback import extract_skills_fallback
from services.gemini import call_with_fallback
from services.pdf_parser import extract_text_from_pdf

router = APIRouter(prefix="/api/resume", tags=["resume"])

_DATA_DIR = Path(__file__).parent.parent / "data"
_MAX_PDF_BYTES = 5 * 1024 * 1024  # 5 MB

_PARSE_PROMPT = """\
You are a resume parser. Extract all skills from the resume below.

Return ONLY valid JSON — no prose, no markdown fences — with this exact shape:
{{
  "skills": [
    {{"name": "skill name", "category": "technical|soft|tool|certification", "confidence": 0.0, "source": "ai"}}
  ],
  "years_experience": 2,
  "education_level": "Bachelor's",
  "raw_summary": "2-3 sentence summary of the candidate's background and strengths"
}}

Rules:
- confidence is a float 0.0–1.0 reflecting how clearly the skill appears
- category: "technical" for languages/frameworks, "tool" for DevOps/infra tools,
  "certification" for cloud certs, "soft" for communication/leadership etc.
- years_experience: total professional years or null if unclear
- Include every distinct skill mentioned, do not invent skills not in the resume

Resume:
---
{resume_text}
---
"""


@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(
    file: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None),
):
    """Accept a PDF upload OR pasted resume text and return extracted skills."""
    if file is not None:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
        raw = await file.read()
        if len(raw) > _MAX_PDF_BYTES:
            raise HTTPException(status_code=400, detail="File exceeds the 5 MB limit.")
        resume_text = extract_text_from_pdf(raw)
    elif text is not None:
        resume_text = text.strip()
    else:
        raise HTTPException(status_code=422, detail="Provide either a PDF file or resume text.")

    if len(resume_text) < 50:
        raise HTTPException(status_code=422, detail="Resume text is too short (minimum 50 characters).")

    resume_text = resume_text[:8000]  # cap to prevent prompt abuse

    prompt = _PARSE_PROMPT.format(resume_text=resume_text)
    result, used_fallback = call_with_fallback(
        primary="lite",
        secondary="flash",
        prompt=prompt,
        rule_fallback_fn=extract_skills_fallback,
        resume_text=resume_text,
    )

    result.pop("used_fallback", None)
    return ResumeParseResponse(**result, used_fallback=used_fallback)


@router.get("/samples")
async def list_samples():
    """Return sample resume metadata for demo mode."""
    resumes = json.loads((_DATA_DIR / "sample_resumes.json").read_text(encoding="utf-8"))
    return [
        {"id": r["id"], "name": r["name"], "role_applying_for": r["role_applying_for"]}
        for r in resumes
    ]
