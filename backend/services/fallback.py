"""
Rule-based fallback — keyword matching with zero network calls.
Used when the Gemini API is unavailable or returns an error.
"""

import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent.parent / "data"


def _load_courses() -> list:
    try:
        return json.loads((_DATA_DIR / "courses.json").read_text(encoding="utf-8"))
    except Exception:
        return []


def _load_job_descriptions() -> list:
    try:
        return json.loads((_DATA_DIR / "job_descriptions.json").read_text(encoding="utf-8"))
    except Exception:
        return []


def _courses_for_skill(skill: str, courses: list) -> list:
    """Return up to 2 courses from the catalog that teach the given skill."""
    skill_lower = skill.lower()
    matches = []
    for course in courses:
        taught_lower = [s.lower() for s in course.get("skills_taught", [])]
        if any(skill_lower in t or t in skill_lower for t in taught_lower):
            matches.append({
                "title": course["title"],
                "platform": course["platform"],
                "url": course["url"],
                "duration_hours": course["duration_hours"],
                "cost": course["cost"],
                "skills_taught": course["skills_taught"],
            })
        if len(matches) >= 2:
            break
    return matches


# Maps skill name → lowercase substrings that indicate the skill is present
SKILL_KEYWORDS: dict[str, list[str]] = {
    # Technical — engineering
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
    # Data & analytics
    "Data Analysis": ["data analysis", "data analyst", "pandas", "numpy", "excel", "spreadsheet", "pivot table", "tableau", "power bi", "looker"],
    "Statistics": ["statistics", "statistical", "regression", "hypothesis", "a/b test", "probability", "r language", "spss", "stata"],
    "Data Visualisation": ["data visual", "tableau", "power bi", "looker", "matplotlib", "seaborn", "d3.js", "chart", "dashboard"],
    # Product & design
    "Product Management": ["product manager", "product management", "roadmap", "sprint", "backlog", "user story", "okr", "kpi", "stakeholder"],
    "UX Design": ["ux", "user experience", "figma", "sketch", "wireframe", "prototype", "usability", "user research", "persona"],
    "UI Design": ["ui design", "user interface", "figma", "adobe xd", "design system", "typography", "colour theory"],
    # Business & operations
    "Project Management": ["project management", "pmp", "agile", "scrum", "kanban", "jira", "confluence", "prince2", "waterfall"],
    "Communication": ["communication", "presentation", "public speak", "stakeholder", "report writing", "documentation"],
    "Leadership": ["leadership", "led a team", "managed a team", "mentored", "line management", "team lead"],
    "Excel / Spreadsheets": ["excel", "google sheets", "spreadsheet", "vlookup", "pivot"],
    # Marketing & sales
    "Digital Marketing": ["digital marketing", "seo", "sem", "google ads", "facebook ads", "social media marketing", "content marketing"],
    "SEO": ["seo", "search engine optimis", "keyword research", "backlink", "google search console"],
    "Copywriting": ["copywriting", "copy writing", "content writing", "blog", "technical writing"],
    # Finance
    "Financial Modelling": ["financial model", "dcf", "financial analysis", "valuation", "excel model", "fp&a"],
    "Accounting": ["accounting", "bookkeeping", "gaap", "ifrs", "quickbooks", "accounts payable", "accounts receivable"],
}

# Maps lowercase role name → required skill names (keys from SKILL_KEYWORDS)
ROLE_REQUIREMENTS: dict[str, list[str]] = {
    # Engineering
    "cloud engineer": ["AWS", "GCP", "Kubernetes", "Docker", "Terraform", "Linux", "Networking", "CI/CD", "Python", "Git"],
    "backend engineer": ["Python", "SQL", "REST APIs", "Docker", "Git", "Linux", "CI/CD"],
    "frontend engineer": ["JavaScript", "TypeScript", "Git", "REST APIs"],
    "fullstack engineer": ["JavaScript", "TypeScript", "Python", "SQL", "REST APIs", "Docker", "Git"],
    "data engineer": ["Python", "SQL", "AWS", "Docker", "Git", "CI/CD", "Linux"],
    "devops engineer": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Terraform", "Git", "Networking", "Python"],
    "ml engineer": ["Python", "Machine Learning", "Docker", "REST APIs", "Git", "SQL", "Linux", "CI/CD"],
    "software engineer": ["Python", "SQL", "Git", "REST APIs", "Docker", "Linux"],
    # Data & analytics
    "data analyst": ["SQL", "Data Analysis", "Statistics", "Data Visualisation", "Python", "Excel / Spreadsheets"],
    "data scientist": ["Python", "Machine Learning", "Statistics", "SQL", "Data Visualisation", "Git"],
    "business analyst": ["Data Analysis", "SQL", "Excel / Spreadsheets", "Communication", "Project Management", "Data Visualisation"],
    # Product & design
    "product manager": ["Product Management", "Communication", "Data Analysis", "Project Management", "Leadership"],
    "ux designer": ["UX Design", "UI Design", "Communication", "Data Analysis"],
    "ui designer": ["UI Design", "UX Design", "Communication"],
    # Business & operations
    "project manager": ["Project Management", "Communication", "Leadership", "Excel / Spreadsheets"],
    "operations manager": ["Project Management", "Communication", "Leadership", "Data Analysis", "Excel / Spreadsheets"],
    # Marketing
    "digital marketer": ["Digital Marketing", "SEO", "Data Analysis", "Copywriting", "Excel / Spreadsheets"],
    "content writer": ["Copywriting", "SEO", "Communication"],
    "seo specialist": ["SEO", "Digital Marketing", "Data Analysis", "Copywriting"],
    # Finance
    "financial analyst": ["Financial Modelling", "Excel / Spreadsheets", "Accounting", "Statistics", "Communication"],
    "accountant": ["Accounting", "Excel / Spreadsheets", "Financial Modelling"],
    # Generic fallback for unknown roles
    "_generic": ["Communication", "Project Management", "Data Analysis", "Excel / Spreadsheets", "Leadership"],
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
        "question": "Give an example of a time you had to collaborate with a team member whose working style was very different from yours. How did you handle it?",
        "category": "behavioral",
        "skill_tested": "collaboration",
        "hint": None,
        "difficulty": "medium",
    },
    {
        "question": "Describe a situation where you had to prioritise competing deadlines. How did you decide what to work on first, and what was the outcome?",
        "category": "behavioral",
        "skill_tested": "prioritisation",
        "hint": None,
        "difficulty": "medium",
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

    # Try job_descriptions.json first, then fall back to hardcoded ROLE_REQUIREMENTS
    role_lower = target_role.lower()
    requirements: list[str] = []
    for jd in _load_job_descriptions():
        if jd["role"].lower() in role_lower or role_lower in jd["role"].lower():
            requirements = jd["required_skills"]
            break
    if not requirements:
        for role_key, required in ROLE_REQUIREMENTS.items():
            if role_key in role_lower or role_lower in role_key:
                requirements = required
                break
    if not requirements:
        requirements = ROLE_REQUIREMENTS["_generic"]

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
    courses = _load_courses()
    milestones = []
    for i, skill in enumerate(capped):
        week = i * 2 + 1
        resources = _courses_for_skill(skill, courses)
        if not resources:
            resources = [{
                "title": f"{skill} — full course",
                "platform": "YouTube",
                "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+full+course",
                "duration_hours": 6,
                "cost": "Free",
                "skills_taught": [skill],
            }]
        milestones.append({
            "week": week,
            "title": f"Learn {skill}",
            "description": f"Build foundational knowledge of {skill} through official docs and hands-on practice.",
            "skills": [skill],
            "resources": resources,
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
    """6 technical questions (gap-focused) + 4 fixed behavioral questions."""
    technical = []
    # Fill up to 6 technical questions; prioritise missing skills then pad with generic role questions
    for skill in missing_skills[:6]:
        technical.append({
            "question": f"Walk me through how you would apply {skill} in a real {target_role} project. What pitfalls would you watch out for?",
            "category": "technical",
            "skill_tested": skill,
            "hint": f"Focus on practical use of {skill} with a concrete example and trade-offs.",
            "difficulty": "medium",
        })
    # Pad to 6 if fewer than 6 missing skills
    while len(technical) < 6:
        technical.append({
            "question": f"Describe the most complex technical challenge you have faced in a {target_role}-type role and how you resolved it.",
            "category": "technical",
            "skill_tested": "general problem-solving",
            "hint": "Structure your answer around the problem, your approach, and the outcome.",
            "difficulty": "hard",
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
