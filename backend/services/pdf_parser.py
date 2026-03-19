import io
import logging

import pdfplumber
from fastapi import HTTPException

logger = logging.getLogger(__name__)

_MAX_PAGES = 10
_PDF_MAGIC = b"%PDF"


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF resume, with magic-byte, page-count and content guardrails."""
    if not file_bytes.startswith(_PDF_MAGIC):
        logger.warning("PDF rejected: missing PDF magic bytes (size=%d bytes)", len(file_bytes))
        raise HTTPException(status_code=400, detail="File does not appear to be a valid PDF.")

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        page_count = len(pdf.pages)
        if page_count > _MAX_PAGES:
            logger.warning("PDF rejected: %d pages exceeds limit of %d", page_count, _MAX_PAGES)
            raise HTTPException(
                status_code=400,
                detail=f"PDF has {page_count} pages. Resumes should be at most {_MAX_PAGES} pages.",
            )
        pages = [page.extract_text() or "" for page in pdf.pages]

    text = "\n".join(pages).strip()

    if not text:
        logger.warning("PDF rejected: no extractable text (likely scanned image)")
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from this PDF. Make sure it is not a scanned image-only file.",
        )

    logger.info("PDF parsed: %d pages, %d chars extracted", page_count, len(text))
    return text
