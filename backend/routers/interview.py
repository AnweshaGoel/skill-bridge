from fastapi import APIRouter

from models.schemas import InterviewQuestion, InterviewRequest, InterviewResponse

router = APIRouter(prefix="/api/interview", tags=["interview"])


@router.post("/questions", response_model=InterviewResponse)
async def get_questions(req: InterviewRequest):
    """Generate mock interview questions targeting the missing skills."""
    # Stub response — real generation implemented with the AI service
    return InterviewResponse(
        questions=[
            InterviewQuestion(
                question="Walk me through how you would containerise a Python web application using Docker.",
                category="technical",
                skill_tested="Docker",
                hint="Think about the Dockerfile, base image choice, and how you'd handle environment variables.",
                difficulty="medium",
            ),
            InterviewQuestion(
                question="Explain the difference between a Kubernetes Deployment and a StatefulSet.",
                category="technical",
                skill_tested="Kubernetes",
                hint="Consider how each handles pod identity and persistent storage.",
                difficulty="medium",
            ),
            InterviewQuestion(
                question="Describe a time you had to learn a new technology quickly under pressure. How did you approach it?",
                category="behavioral",
                skill_tested="adaptability",
                hint=None,
                difficulty="easy",
            ),
            InterviewQuestion(
                question="You need to design a system that processes 1 million events per day from IoT devices. Walk me through your high-level architecture.",
                category="system-design",
                skill_tested="distributed systems",
                hint="Consider ingestion, storage, processing, and query layers separately.",
                difficulty="hard",
            ),
        ],
        used_fallback=False,
    )
