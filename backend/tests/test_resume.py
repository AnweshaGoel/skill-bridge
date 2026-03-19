from unittest.mock import patch

import pytest

from tests.conftest import LONG_RESUME

_AI_RESULT = {
    "skills": [
        {"name": "Python", "category": "technical", "confidence": 0.95, "source": "ai"},
        {"name": "SQL", "category": "technical", "confidence": 0.85, "source": "ai"},
    ],
    "years_experience": 1,
    "education_level": "Bachelor's",
    "raw_summary": "CS graduate with Python and SQL experience.",
}


@pytest.mark.asyncio
async def test_parse_valid_text_returns_skills(client):
    with patch("services.gemini._call_model", return_value=_AI_RESULT):
        resp = await client.post("/api/resume/parse", data={"text": LONG_RESUME})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["skills"]) > 0
    assert body["used_fallback"] is False
    assert "raw_summary" in body


@pytest.mark.asyncio
async def test_parse_empty_string_returns_422(client):
    resp = await client.post("/api/resume/parse", data={"text": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_parse_short_text_returns_422(client):
    resp = await client.post("/api/resume/parse", data={"text": "Python dev"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_parse_no_recognisable_skills_does_not_crash(client):
    """A valid-length resume with no detectable skills should return 200, not crash."""
    bland_resume = (
        "I enjoy working in teams and communicating clearly. "
        "I am a quick learner who adapts well to new environments. "
        "I have experience coordinating projects and meeting deadlines consistently. "
        "I work well under pressure and maintain attention to detail at all times."
    )
    no_skills_result = {
        "skills": [],
        "years_experience": None,
        "education_level": None,
        "raw_summary": "Candidate lists soft skills only; no technical skills detected.",
    }
    with patch("services.gemini._call_model", return_value=no_skills_result):
        resp = await client.post("/api/resume/parse", data={"text": bland_resume})
    assert resp.status_code == 200
    assert isinstance(resp.json()["skills"], list)


@pytest.mark.asyncio
async def test_parse_falls_back_when_ai_unavailable(client):
    """When Gemini raises, the fallback runs and used_fallback is True."""
    with patch("services.gemini._call_model", side_effect=Exception("API down")):
        resp = await client.post("/api/resume/parse", data={"text": LONG_RESUME})
    assert resp.status_code == 200
    assert resp.json()["used_fallback"] is True
