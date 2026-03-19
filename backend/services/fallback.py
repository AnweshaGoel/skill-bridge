"""
Rule-based fallback — keyword matching with zero network calls.
Used when the Gemini API is unavailable or returns an error.
"""

# Maps skill name → lowercase substrings that indicate the skill is present
SKILL_KEYWORDS: dict[str, list[str]] = {
    "Python": ["python"],
    "JavaScript": ["javascript", " js ", "node.js", "nodejs", "react", "vue", "angular"],
    "TypeScript": ["typescript", ".tsx", ".ts "],
    "SQL": ["sql", "postgresql", "mysql", "sqlite", "postgres", "database query"],
    "Docker": ["docker", "containeris", "containeriz", "dockerfile"],
    "Kubernetes": ["kubernetes", "k8s", "kubectl", "helm"],
    "AWS": ["aws", "amazon web services", "ec2", "s3 bucket", "lambda", "eks", "ecs", "cloudwatch"],
    "GCP": ["gcp", "google cloud", "bigquery", "gke", "cloud run", "cloud functions"],
    "Git": ["git", "github", "gitlab", "bitbucket", "version control"],
    "Linux": ["linux", "ubuntu", "debian", "centos", "bash", "shell script", "unix"],
    "Machine Learning": ["machine learning", " ml ", "sklearn", "scikit", "tensorflow", "pytorch", "neural network", "deep learning", "model train"],
    "REST APIs": ["rest api", "restful", "http api", "fastapi", "flask", "django rest", "express", "api endpoint", "openapi", "swagger"],
    "CI/CD": ["ci/cd", "github actions", "jenkins", "gitlab ci", "circleci", "travis", "continuous integration", "continuous deploy", "pipeline"],
    "Terraform": ["terraform", "infrastructure as code", " iac", "hashicorp"],
    "Networking": ["networking", "tcp/ip", "dns", "vpc", "subnet", "firewall", "load balanc", "cdn", "http/https"],
}

# Maps lowercase role name → required skill names (keys from SKILL_KEYWORDS)
ROLE_REQUIREMENTS: dict[str, list[str]] = {
    "cloud engineer": ["AWS", "GCP", "Kubernetes", "Docker", "Terraform", "Linux", "Networking", "CI/CD", "Python", "Git"],
    "backend engineer": ["Python", "SQL", "REST APIs", "Docker", "Git", "Linux", "CI/CD"],
    "frontend engineer": ["JavaScript", "TypeScript", "Git", "REST APIs"],
    "fullstack engineer": ["JavaScript", "TypeScript", "Python", "SQL", "REST APIs", "Docker", "Git"],
    "data engineer": ["Python", "SQL", "AWS", "Docker", "Git", "CI/CD", "Linux"],
    "devops engineer": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Terraform", "Git", "Networking", "Python"],
    "ml engineer": ["Python", "Machine Learning", "Docker", "REST APIs", "Git", "SQL", "Linux", "CI/CD"],
    "software engineer": ["Python", "SQL", "Git", "REST APIs", "Docker", "Linux"],
}

_BEHAVIORAL_QUESTIONS = [
    {
        "question": "Describe a time you had to learn a new technology quickly under a tight deadline. What was your approach and what did you take away from it?",
        "category": "behavioral",
        "skill_tested": "adaptability",
        "hint": None,
        "difficulty": "easy",
    },
    {
        "question": "Tell me about a project where things didn't go as planned. How did you identify the problem and what did you do to get back on track?",
        "category": "behavioral",
        "skill_tested": "problem-solving",
        "hint": None,
        "difficulty": "easy",
    },
    {
        "question": "You need to design a system that must handle 10× its current load within three months. Walk me through how you would approach the architecture decision and the trade-offs involved.",
        "category": "system-design",
        "skill_tested": "scalability",
        "hint": "Consider horizontal vs vertical scaling, caching, database sharding, and async processing.",
        "difficulty": "hard",
    },
]


def extract_skills_fallback(resume_text: str) -> dict:
    """Keyword-scan a resume and return matched skills."""
    lowered = resume_text.lower()
    skills = []
    for skill_name, keywords in SKILL_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            skills.append({
                "name": skill_name,
                "category": _categorise(skill_name),
                "confidence": 0.7,
                "source": "fallback",
            })
    return {
        "skills": skills,
        "years_experience": None,
        "education_level": None,
        "raw_summary": (
            "Skill extraction ran in offline mode. "
            "Results are based on keyword matching and may be incomplete."
        ),
        "used_fallback": True,
    }


def gap_analysis_fallback(resume_text: str, target_role: str) -> dict:
    """Diff resume skills against role requirements using keyword matching."""
    parsed = extract_skills_fallback(resume_text)
    found_skills = {s["name"] for s in parsed["skills"]}

    # Fuzzy-match role to ROLE_REQUIREMENTS by substring
    role_lower = target_role.lower()
    requirements: list[str] = []
    for role_key, required in ROLE_REQUIREMENTS.items():
        if role_key in role_lower or role_lower in role_key:
            requirements = required
            break
    if not requirements:
        # Unknown role — use generic software engineer requirements
        requirements = ROLE_REQUIREMENTS["software engineer"]

    skill_gaps = []
    for skill in requirements:
        status = "present" if skill in found_skills else "missing"
        skill_gaps.append({
            "skill": skill,
            "category": _categorise(skill),
            "status": status,
            "importance": "critical" if skill in requirements[:3] else "important",
            "user_evidence": None,
        })

    present_count = sum(1 for s in skill_gaps if s["status"] == "present")
    match_score = round(present_count / len(requirements) * 100) if requirements else 0
    top_missing = [s["skill"] for s in skill_gaps if s["status"] == "missing"][:5]

    return {
        "target_role": target_role,
        "match_score": match_score,
        "skills": skill_gaps,
        "summary": (
            f"Offline analysis found {present_count} of {len(requirements)} "
            f"required skills for {target_role}. "
            "Connect to the internet for a deeper AI-powered analysis."
        ),
        "top_missing": top_missing,
        "used_fallback": True,
    }


def roadmap_fallback(target_role: str, missing_skills: list) -> dict:
    """Generate a simple milestone per missing skill (max 6, 2 weeks each)."""
    capped = missing_skills[:6]
    milestones = []
    for i, skill in enumerate(capped):
        week = i * 2 + 1
        milestones.append({
            "week": week,
            "title": f"Learn {skill}",
            "description": f"Build foundational knowledge of {skill} through official docs and hands-on practice.",
            "skills": [skill],
            "resources": [{
                "title": f"{skill} — freeCodeCamp full course",
                "platform": "YouTube (freeCodeCamp)",
                "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+full+course+freecodecamp",
                "duration_hours": 6,
                "cost": "Free",
                "skills_taught": [skill],
            }],
            "deliverable": f"Complete a small project demonstrating {skill} and push it to GitHub.",
        })

    return {
        "total_weeks": len(capped) * 2,
        "milestones": milestones,
        "final_project_idea": (
            f"Build a {target_role}-relevant project that incorporates all the skills above "
            "and deploy it publicly to demonstrate readiness for the role."
        ),
        "used_fallback": True,
    }


def interview_fallback(target_role: str, missing_skills: list) -> dict:
    """One technical question per missing skill (max 5) + 3 fixed behavioral/system-design."""
    technical = []
    for skill in missing_skills[:5]:
        technical.append({
            "question": f"Explain {skill} in your own words and walk me through how you would use it in a real {target_role} project.",
            "category": "technical",
            "skill_tested": skill,
            "hint": f"Focus on the core concept of {skill} and give a concrete, specific example.",
            "difficulty": "medium",
        })

    return {
        "questions": technical + _BEHAVIORAL_QUESTIONS,
        "used_fallback": True,
    }


def _categorise(skill_name: str) -> str:
    tools = {"Docker", "Kubernetes", "Git", "Terraform", "CI/CD"}
    certs = {"AWS", "GCP"}
    if skill_name in tools:
        return "tool"
    if skill_name in certs:
        return "certification"
    return "technical"
