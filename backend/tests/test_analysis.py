from unittest.mock import patch

import pytest

from tests.conftest import LONG_RESUME

_AI_RESULT = {
    "match_score": 62,
    "skills": [
        {"skill": "Python", "category": "technical", "status": "present", "importance": "critical", "user_evidence": "Python (3 years)"},
        {"skill": "Docker", "category": "tool", "status": "partial", "importance": "critical", "user_evidence": "Docker (basic)"},
        {"skill": "Kubernetes", "category": "tool", "status": "missing", "importance": "important", "user_evidence": None},
    ],
    "summary": "Strong Python background but lacks cloud and orchestration skills.",
    "top_missing": ["Kubernetes", "AWS", "CI/CD"],
}


@pytest.mark.asyncio
async def test_gap_analysis_happy_path(client):
    with patch("services.gemini._call_model", return_value=_AI_RESULT):
        resp = await client.post("/api/analysis/gap", json={
            "resume_text": LONG_RESUME,
            "target_role": "Software Engineer",
        })
    assert resp.status_code == 200
    body = resp.json()
    assert 0 <= body["match_score"] <= 100
    assert isinstance(body["skills"], list)
    assert len(body["skills"]) > 0
    assert body["used_fallback"] is False


@pytest.mark.asyncio
async def test_gap_analysis_unknown_role_returns_200(client):
    """An unrecognised role should fall back gracefully, not 500."""
    with patch("services.gemini._call_model", side_effect=Exception("model error")):
        resp = await client.post("/api/analysis/gap", json={
            "resume_text": LONG_RESUME,
            "target_role": "Quantum Engineer",
        })
    assert resp.status_code == 200
    body = resp.json()
    assert 0 <= body["match_score"] <= 100
    assert body["used_fallback"] is True


@pytest.mark.asyncio
async def test_gap_analysis_special_chars_in_role(client):
    """Special characters in the role name should not crash the endpoint."""
    with patch("services.gemini._call_model", return_value=_AI_RESULT):
        resp = await client.post("/api/analysis/gap", json={
            "resume_text": LONG_RESUME,
            "target_role": "Sr. DevOps/SRE!",
        })
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_gap_analysis_short_resume_returns_422(client):
    resp = await client.post("/api/analysis/gap", json={
        "resume_text": "too short",
        "target_role": "Engineer",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_gap_analysis_falls_back_when_ai_unavailable(client):
    with patch("services.gemini._call_model", side_effect=Exception("API down")):
        resp = await client.post("/api/analysis/gap", json={
            "resume_text": LONG_RESUME,
            "target_role": "Backend Engineer",
        })
    assert resp.status_code == 200
    assert resp.json()["used_fallback"] is True
