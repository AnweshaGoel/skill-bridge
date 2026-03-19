from unittest.mock import patch

import pytest

_MILESTONE = {
    "week": 1,
    "title": "Docker fundamentals",
    "description": "Learn containerisation basics.",
    "skills": ["Docker"],
    "resources": [{
        "title": "Docker Official Tutorial",
        "platform": "Docker Docs",
        "url": "https://docs.docker.com/get-started/",
        "duration_hours": 5,
        "cost": "Free",
        "skills_taught": ["Docker"],
    }],
    "deliverable": "Run a containerised web app locally.",
}

_AI_RESULT = {
    "total_weeks": 4,
    "milestones": [_MILESTONE],
    "final_project_idea": "Deploy a containerised app to the cloud.",
}

_LONG_RESULT = {
    "total_weeks": 24,
    "milestones": [_MILESTONE],
    "final_project_idea": "Build a full production-grade deployment pipeline.",
}


@pytest.mark.asyncio
async def test_roadmap_happy_path(client):
    with patch("services.gemini._call_model", return_value=_AI_RESULT):
        resp = await client.post("/api/roadmap/generate", json={
            "target_role": "Cloud Engineer",
            "missing_skills": ["Docker", "Kubernetes"],
        })
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["milestones"]) > 0
    assert body["total_weeks"] > 0
    assert body["used_fallback"] is False


@pytest.mark.asyncio
async def test_roadmap_empty_missing_skills(client):
    """Empty missing_skills list should return 200 with empty milestones."""
    resp = await client.post("/api/roadmap/generate", json={
        "target_role": "Cloud Engineer",
        "missing_skills": [],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["milestones"] == []
    assert body["total_weeks"] == 0


@pytest.mark.asyncio
async def test_roadmap_low_hours_produces_long_plan(client):
    """hours_per_week=1 should produce a longer roadmap, not crash."""
    with patch("services.gemini._call_model", return_value=_LONG_RESULT):
        resp = await client.post("/api/roadmap/generate", json={
            "target_role": "Cloud Engineer",
            "missing_skills": ["Docker", "Kubernetes", "Terraform"],
            "available_hours_per_week": 1,
        })
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_weeks"] > 20


@pytest.mark.asyncio
async def test_roadmap_falls_back_when_ai_unavailable(client):
    with patch("services.gemini._call_model", side_effect=Exception("API down")):
        resp = await client.post("/api/roadmap/generate", json={
            "target_role": "DevOps Engineer",
            "missing_skills": ["Kubernetes", "Terraform"],
        })
    assert resp.status_code == 200
    assert resp.json()["used_fallback"] is True
