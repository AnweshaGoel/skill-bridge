"""
Gemini LLM integration — model routing, retry logic, structured JSON output.

Model map:
  "lite"  → gemini-2.5-flash-lite   (fast, cheap — resume extraction)
  "flash" → gemini-2.5-flash         (balanced — roadmap, interview)
  "pro"   → gemini-2.5-pro           (highest quality — gap analysis)

Fallback chain: primary model → secondary model → rule-based fallback function.
Always returns a response; never raises to the caller.
"""

import json
import os
import re
from typing import Any, Callable

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

_MODELS: dict[str, str] = {
    "lite": "gemini-2.5-flash-lite",
    "flash": "gemini-2.5-flash",
    "pro": "gemini-2.5-pro",
}


def _clean_json(text: str) -> Any:
    """Strip markdown fences and parse JSON from a model response."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ``` wrappers
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    return json.loads(text.strip())


def _call_model(model_key: str, prompt: str, temperature: float = 0.3) -> Any:
    """Call the named Gemini model and return parsed JSON. Raises on any failure."""
    model = genai.GenerativeModel(_MODELS[model_key])
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(temperature=temperature),
    )
    return _clean_json(response.text)


def call_with_fallback(
    primary: str,
    secondary: str,
    prompt: str,
    rule_fallback_fn: Callable[..., dict],
    **kwargs: Any,
) -> tuple[dict, bool]:
    """
    Try primary model → secondary model → rule_fallback_fn.
    Returns (result_dict, used_fallback).
    """
    for model_key in (primary, secondary):
        try:
            result = _call_model(model_key, prompt)
            return result, False
        except Exception:
            continue

    # Both models failed — use the rule-based fallback
    return rule_fallback_fn(**kwargs), True
