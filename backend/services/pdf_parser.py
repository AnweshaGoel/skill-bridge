import io

import pdfplumber
from fastapi import HTTPException

_MAX_PAGES = 10
_PDF_MAGIC = b"%PDF"


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF resume, with magic-byte, page-count and content guardrails."""
    if not file_bytes.startswith(_PDF_MAGIC):
        raise HTTPException(status_code=400, detail="File does not appear to be a valid PDF.")

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
