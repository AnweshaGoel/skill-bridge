import pytest
from httpx import ASGITransport, AsyncClient

from main import app

LONG_RESUME = """\
Jane Smith | jane@example.com | github.com/janesmith

EDUCATION
B.S. Computer Science, State University, May 2024 — GPA 3.8

SKILLS
Python (3 years), JavaScript, SQL, PostgreSQL, Git, GitHub, REST APIs, Flask, React,
Docker (basic), Linux (Ubuntu), pytest, HTML/CSS

EXPERIENCE
Software Engineering Intern, Acme Corp (Jun–Aug 2023)
- Built 5 REST API endpoints in Python/Flask serving 10 000 daily requests
- Wrote unit tests with pytest achieving 85% coverage
- Used Docker Compose for local development
- Queried and optimised PostgreSQL tables with complex JOINs

Teaching Assistant, State University (Jan 2023–May 2024)
- Taught Python data structures to 60 students weekly

PROJECTS
Personal Finance Tracker — Python, Flask, PostgreSQL, deployed on Linux VPS
Open-source contribution: fixed 3 bugs in a Python data-validation library
"""


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
