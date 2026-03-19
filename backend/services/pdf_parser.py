import io
import pdfplumber


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF, joining all pages with newlines."""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(pages).strip()
