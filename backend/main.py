from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import resume, analysis, roadmap, interview

app = FastAPI(
    title="Skill-Bridge API",
    version="1.0.0",
    description="AI-powered career gap analyser and learning roadmap generator",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router)
app.include_router(analysis.router)
app.include_router(roadmap.router)
app.include_router(interview.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}
