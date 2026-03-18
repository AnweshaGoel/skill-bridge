# Skill-Bridge Career Navigator

> AI-powered career gap analyser and learning roadmap generator.


Candidate Name: Anwesha Goel
Scenario Chosen: Skill-Bridge Career Navigator
Estimated Time Spent:


## Demo

[Live URL] | [5-min Video Walkthrough]

## Quick Start

### Prerequisites
- A free Gemini API key from https://aistudio.google.com/app/apikey
- Docker + Docker Compose (recommended), OR Python 3.11+ and Node.js 18+

### Run with Docker (recommended)
```bash
cp .env.example .env        # fill in GEMINI_API_KEY
docker compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
# API docs → http://localhost:8000/docs
```

### Run without Docker
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env                            # then fill in GEMINI_API_KEY
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Test Commands
```bash
cd backend && pytest tests/ -v
cd frontend && npm run test
```

## AI Disclosure
- **AI assistant used:** Claude (claude.ai) for architecture planning and spec generation
- **Verification method:** Every AI-generated code block reviewed, tested, and run locally
- **Rejected suggestion example:** 


## Tradeoffs & Prioritisation

### What was cut to stay within 4–6 hours?
- No user authentication (out of scope for demo)
- No persistent database (JSON flat files only)
- PDF rendering preview removed (text extraction kept)
- [fill in others]

### What would be built next?
- PostgreSQL persistence for saved roadmaps
- OAuth login to track progress across sessions
- Integration with LinkedIn to pull live resume data
- Slack/email notifications for milestone reminders
- Comparison mode: your profile vs industry benchmarks

### Known Limitations
- Gemini API has rate limits on free tier; fallback triggers after ~10 req/min
- PDF extraction quality depends on PDF structure; scanned PDFs not supported
- Course recommendations are AI-generated and should be verified before enrolling
- Skill matching is imperfect for niche or emerging roles
