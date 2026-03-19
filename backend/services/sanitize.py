"""Input sanitization helpers for user-supplied text before LLM prompt interpolation."""

import re

# Strip ASCII control characters except tab (\x09), newline (\x0a), carriage return (\x0d)
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_text(text: str, max_length: int) -> str:
    """Remove control characters and cap length to prevent prompt abuse."""
    text = _CONTROL_CHARS.sub("", text)
    return text[:max_length]
