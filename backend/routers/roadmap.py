from fastapi import APIRouter

from models.schemas import Course, Milestone, RoadmapRequest, RoadmapResponse

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap(req: RoadmapRequest):
    """Generate a week-by-week learning roadmap for the missing skills."""
    if not req.missing_skills:
        return RoadmapResponse(
            total_weeks=0,
            milestones=[],
            final_project_idea="No missing skills — you're ready to apply!",
            used_fallback=False,
        )

    # Stub response — real generation implemented with the AI service
    return RoadmapResponse(
        total_weeks=4,
        milestones=[
            Milestone(
                week=1,
                title="Docker fundamentals",
                description="Learn containerisation concepts and build your first image.",
                skills=["Docker"],
                resources=[
                    Course(
                        title="Docker Official Getting Started Tutorial",
                        platform="Docker Docs",
                        url="https://docs.docker.com/get-started/",
                        duration_hours=5,
                        cost="Free",
                        skills_taught=["Docker", "Containers", "Docker Compose"],
                    )
                ],
                deliverable="Run a containerised web app locally with Docker Compose.",
            ),
            Milestone(
                week=3,
                title="Kubernetes basics",
                description="Deploy and manage containers at scale with Kubernetes.",
                skills=["Kubernetes"],
                resources=[
                    Course(
                        title="Kubernetes Interactive Tutorial",
                        platform="Kubernetes.io",
                        url="https://kubernetes.io/docs/tutorials/kubernetes-basics/",
                        duration_hours=4,
                        cost="Free",
                        skills_taught=["Kubernetes", "Pods", "Deployments", "Services"],
                    )
                ],
                deliverable="Deploy a multi-container app to a local Kubernetes cluster.",
            ),
        ],
        final_project_idea=(
            f"Build and deploy a {req.target_role}-relevant application "
            "using Docker and Kubernetes on a cloud provider free tier."
        ),
        used_fallback=False,
    )
