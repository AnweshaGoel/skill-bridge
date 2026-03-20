# Skill-Bridge Career Navigator — Design Document

---

## 1. Problem & Design Philosophy

Candidates preparing for a job search typically lack a clear, evidence-based view of which skills separate them from a target role. Generic advice ("learn Python") provides no structured path. Skill-Bridge takes a resume and a target role, identifies the exact skill gap, and generates a prioritized learning roadmap and mock interview questions calibrated to those gaps.

Three constraints shaped the design. The system must always return a useful response, even with no network access and no API key — this drives a layered fallback architecture. Complexity belongs in the backend; the frontend's job is to surface data clearly. The entire stack must run on a single `docker compose up` command with no database, no managed cloud service, and no paid dependency beyond an optional API key.

---

## 2. Architecture Overview

The system is a conventional client-server SPA. The React frontend communicates through four POST endpoints on the FastAPI backend. Each endpoint routes the request through a three-level processing chain: primary Gemini model, fallback Gemini model, then a fully offline rule-based implementation. No state persists server-side; the only persistent state lives in the browser via React Router navigation state and `localStorage`.

```
Browser
  │
  │  HTTP (dev: Vite proxy → :8000  |  prod: direct)
  ▼
┌────────────────────────────────────────────────────┐
│  React 18 SPA  (Vite dev  /  nginx:8080 prod)      │
│  LandingPage → AnalysisPage → RoadmapPage          │
│  localStorage: theme, roadmap cache, progress      │
└───────────────────────┬────────────────────────────┘
                        │  REST  (JSON / multipart)
                        ▼
┌────────────────────────────────────────────────────┐
│  FastAPI  (uvicorn :8000)                          │
│  slowapi rate-limit: 10 req/min/IP on AI routes    │
│                                                    │
│  POST /api/resume/parse      → resume router       │
│  POST /api/analysis/gap      → analysis router     │
│  POST /api/roadmap/generate  → roadmap router      │
│  POST /api/interview/questions→ interview router   │
└──────────────┬───────────────┬────────────────────┘
               │               │
   ┌───────────▼──────┐  ┌─────▼──────────────────┐
   │  services/       │  │  backend/data/          │
   │  gemini.py       │  │  courses.json           │
   │  (Gemini API)    │  │  job_descriptions.json  │
   │       │ (fail)   │  │  sample_resumes.json    │
   │       ▼          │  └────────────────────────┘
   │  fallback.py     │
   │  (offline rules) │
   └──────────────────┘
```

---

## 3. Technical Stack

| Technology | Version | Reason |
|---|---|---|
| FastAPI | 0.111.0 | Async-native Python framework; Pydantic integration generates request validation with no extra code |
| Uvicorn | 0.29.0 | ASGI server required by FastAPI; `[standard]` extras include uvloop for throughput |
| Pydantic v2 | 2.7.0 | Strict schema validation; v2 compile-time model validation is significantly faster than v1 |
| pdfplumber | 0.11.0 | More reliable multi-column layout extraction than PyPDF2; handles common resume formats |
| google-generativeai | 0.7.2 | Official Gemini SDK; typed response objects, no manual HTTP construction |
| slowapi | 0.1.9 | FastAPI-compatible rate-limiting; single decorator per route, no middleware refactor |
| python-dotenv | 1.0.1 | Standard env-var loading; keeps secrets out of source |
| React 18 | 18.3.0 | Concurrent rendering; stable hooks API for a three-page SPA |
| React Router 6 | 6.23.0 | Navigation state passes structured data between pages without a global store |
| Tailwind CSS | 3.4.0 | Utility-first CSS combined with CSS custom properties for runtime dark/light switching |
| Vite | 5.3.0 | Fast HMR; manual chunk splitting separates vendor, charts, and motion bundles |
| Recharts | 2.12.0 | Lightweight React charting; adequate for a single horizontal bar chart |
| Framer Motion | 11.2.0 | Declarative animation API; staggered entrance animations with minimal imperative code |
| react-dropzone | 14.2.3 | Handles drag-and-drop with built-in MIME filtering and size enforcement |
| pytest + pytest-asyncio | 8.2.0 | Standard Python test suite; asyncio mode required for FastAPI's async test client |
| Vitest | 1.6.0 | Vite-native test runner; shares the same transform pipeline as production builds |
| nginx | 1.28-alpine | Serves the compiled static bundle in production; no Node runtime in the container |
| Docker + Compose | — | Reproducible local environment; multi-stage builds keep images small |
| GitHub Actions | — | CI on every push; Docker image publish to GHCR on main-branch merge |

---

## 4. AI Design Decisions

Each task is routed to a different Gemini model based on the quality-versus-cost tradeoff appropriate to that task. Resume skill extraction uses `gemini-2.5-flash-lite` because it is latency-sensitive and the task is largely keyword recognition that does not require deep reasoning. Gap analysis uses `gemini-2.5-pro` because accuracy here propagates into every downstream output — a wrong gap assessment produces a wrong roadmap and wrong interview questions. Roadmap and interview generation use `gemini-2.5-flash`: the prompts are complex and benefit from a capable model, but the latency cost of `pro` is not warranted.

The fallback chain operates at three levels. If the primary model raises `ResourceExhausted` or `ServiceUnavailable`, `gemini.py` retries with `gemini-2.5-flash`. If that also fails or if no API key is configured, the request delegates to `fallback.py`. The rule-based fallback performs case-insensitive substring matching against a dictionary of 60+ skills, diffs the result against a hardcoded map of 19 role-to-skill requirements, and generates milestones and questions from templates — all with zero network calls. Every endpoint includes a `used_fallback: true` flag in its response when this path is taken. LLM temperature is fixed at 0.3 across all tasks to favor consistency over creativity; this also makes test assertions more stable.

---

## 5. Security Decisions

The Gemini API key is loaded from environment variables via `python-dotenv` and is absent from source and version control. Uploaded PDFs are validated by magic-byte check (`%PDF` prefix) before `pdfplumber` processes them, capped at 10 pages, and rejected if no text can be extracted — this catches scanned-image PDFs that would otherwise pass MIME validation. Resume text is stripped of ASCII control characters and capped at 8,000 characters before insertion into any LLM prompt, limiting prompt-injection surface. Rate limiting at 10 requests per minute per IP applies to all AI endpoints. CORS is restricted to `localhost:5173`, `localhost:3000`, `*.vercel.app`, and `*.onrender.com`. Both Docker containers run as non-root users (`appuser` UID 1000 on the backend, `nginxuser` UID 1001 on the frontend). Resume text is never written to logs.

---

## 6. Tradeoffs

| Decision | Chosen | Rejected | Reason |
|---|---|---|---|
| Data persistence | JSON flat files | PostgreSQL / SQLite | No user accounts, no cross-session state; a database would add infrastructure with no payoff at this scale |
| Authentication | None | JWT / OAuth | Out of scope; would require a user table, token rotation, and a session store |
| Frontend state | Router state + `localStorage` | Redux / Zustand | Three pages with a linear flow; a global store adds indirection without solving a real problem |
| Backend base image | `python:3.11-slim-bookworm` | `python:3.11-alpine` | `pdfplumber` links against system libraries absent in musl/Alpine; Debian slim is larger but reliable |
| Course URL generation | Computed at render time in the frontend | Stored by AI or in database | AI-generated URLs hallucinate; generating a search URL from the platform name is deterministic and always resolvable |
| Interview question mix | Fixed 6 technical + 4 behavioral | Fully dynamic | A predictable structure makes output consistent across models and testable with exact assertions |
| Frontend routing data | `useNavigate` + router state | URL query params | Structured data (full resume text, skills array) does not serialize cleanly into URLs |

---

## 7. Future Enhancements

### Near Term

Resume parsing currently treats the document as a flat text blob. Extracting structured sections — work history, education, certifications — would improve prompt quality and allow per-section confidence scoring. The roadmap currently generates fixed 2-week milestones; accepting an "hours per week" input and calibrating milestone duration accordingly would make the output more actionable. The progress tracker stores completed milestones in browser `localStorage`, which is device-local; an anonymous session token backed by a lightweight server store would let progress survive across devices without requiring user accounts.

### Medium Term

The fallback role-requirements map is hardcoded to 19 roles. Replacing it with a vector-similarity search over the `job_descriptions.json` dataset — using a locally embedded model or a lightweight embedding endpoint — would generalize to arbitrary roles without manual curation and would degrade gracefully when the role name is unusual. The skill gap visualization currently shows only coverage status; overlaying market frequency data (how often the skill appears in real job postings for that role) would allow users to prioritize gaps by economic impact rather than by count alone.

### Long Term

The current architecture has no observability beyond per-request latency logging. A production deployment would require structured telemetry: trace IDs per analysis session, fallback rate per endpoint, and p95 latency per model tier, so that operators can detect when Gemini quota exhaustion is silently degrading quality. The flat-file course database would benefit from an automated refresh pipeline sourced from platform APIs, with staleness detection to surface when linked courses have been removed or restructured. The stateless backend scales horizontally without code changes, but the in-process rate-limiter would need to migrate to a shared Redis instance to enforce limits correctly across multiple replicas.
