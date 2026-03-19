import io

import pdfplumber
from fastapi import HTTPException

_MAX_PAGES = 10


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF resume, with page-count and content guardrails."""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        if len(pdf.pages) > _MAX_PAGES:
            raise HTTPException(
                status_code=400,
                detail=f"PDF has {len(pdf.pages)} pages. Resumes should be at most {_MAX_PAGES} pages.",
            )
        pages = [page.extract_text() or "" for page in pdf.pages]

    text = "\n".join(pages).strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from this PDF. Make sure it is not a scanned image-only file.",
        )

    return text
