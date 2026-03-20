"""
Tests for the rule-based fallback service — all functions must work with
zero network calls and must return used_fallback=True.
"""

import pytest

from services.fallback import (
    extract_skills_fallback,
    gap_analysis_fallback,
    interview_fallback,
    roadmap_fallback,
)


# ── extract_skills_fallback ───────────────────────────────────────────────────

def test_extract_finds_python_in_resume():
    result = extract_skills_fallback("experienced python django flask developer with sql")
    names = [s["name"] for s in result["skills"]]
    assert "Python" in names


def test_extract_finds_docker_and_kubernetes():
    result = extract_skills_fallback(
        "used docker to containerise services and deployed to a k8s cluster on aws"
    )
    names = [s["name"] for s in result["skills"]]
    assert "Docker" in names
    assert "Kubernetes" in names
    assert "AWS" in names


def test_extract_returns_used_fallback_true():
    result = extract_skills_fallback("python developer with git and sql experience and linux")
    assert result["used_fallback"] is True


def test_extract_confidence_is_0_7():
    result = extract_skills_fallback("python and docker developer")
    for skill in result["skills"]:
        assert skill["confidence"] == 0.7
        assert skill["source"] == "fallback"


# ── gap_analysis_fallback ────────────────────────────────────────────────────

def test_gap_cloud_engineer_missing_kubernetes_terraform():
    result = gap_analysis_fallback(
        resume_text="Python developer with git experience",
        target_role="Cloud Engineer",
    )
    missing = [s["skill"] for s in result["skills"] if s["status"] == "missing"]
    assert "Kubernetes" in missing
    assert "Terraform" in missing


def test_gap_match_score_in_range():
    result = gap_analysis_fallback(
        resume_text="python docker kubernetes terraform aws git linux ci/cd",
        target_role="Cloud Engineer",
    )
    assert 0 <= result["match_score"] <= 100


def test_gap_unknown_role_does_not_crash():
    result = gap_analysis_fallback(
        resume_text="python and git experience on linux systems",
        target_role="Quantum Engineer",
    )
    assert result["used_fallback"] is True
    assert "match_score" in result


def test_gap_returns_used_fallback_true():
    result = gap_analysis_fallback("python developer", "Backend Engineer")
    assert result["used_fallback"] is True


# ── roadmap_fallback ─────────────────────────────────────────────────────────

def test_roadmap_three_missing_skills_produces_three_milestones():
    result = roadmap_fallback(
        target_role="Cloud Engineer",
        missing_skills=["Docker", "Kubernetes", "Terraform"],
    )
    assert len(result["milestones"]) == 3


def test_roadmap_caps_at_six_milestones():
    result = roadmap_fallback(
        target_role="DevOps Engineer",
        missing_skills=["A", "B", "C", "D", "E", "F", "G", "H"],
    )
    assert len(result["milestones"]) <= 6


def test_roadmap_empty_skills_returns_empty_milestones():
    result = roadmap_fallback(target_role="Backend Engineer", missing_skills=[])
    assert result["milestones"] == []
    assert result["total_weeks"] == 0


def test_roadmap_returns_used_fallback_true():
    result = roadmap_fallback("ML Engineer", ["Python", "Docker"])
    assert result["used_fallback"] is True


# ── interview_fallback ───────────────────────────────────────────────────────

def test_interview_two_skills_returns_at_least_five_questions():
    result = interview_fallback(
        target_role="Cloud Engineer",
        missing_skills=["Docker", "Kubernetes"],
    )
    assert len(result["questions"]) >= 5


def test_interview_includes_behavioral():
    result = interview_fallback("Backend Engineer", ["Python", "Docker"])
    categories = {q["category"] for q in result["questions"]}
    assert "behavioral" in categories
    assert "technical" in categories


def test_interview_caps_technical_at_six():
    result = interview_fallback(
        target_role="DevOps Engineer",
        missing_skills=["A", "B", "C", "D", "E", "F", "G"],
    )
    technical = [q for q in result["questions"] if q["category"] == "technical"]
    assert len(technical) <= 6


def test_interview_returns_used_fallback_true():
    result = interview_fallback("ML Engineer", ["Docker"])
    assert result["used_fallback"] is True
