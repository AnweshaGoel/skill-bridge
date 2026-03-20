import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { InterviewPanel } from "../components/InterviewPanel";
import type { InterviewResponse } from "../types";

const INTERVIEW: InterviewResponse = {
  used_fallback: false,
  questions: [
    {
      question: "Explain Docker and its use in CI/CD pipelines.",
      category: "technical",
      skill_tested: "Docker",
      hint: "Focus on image layering and registry workflows.",
      difficulty: "medium",
    },
    {
      question: "Tell me about a time you resolved a production incident under pressure.",
      category: "behavioral",
      skill_tested: "adaptability",
      hint: null,
      difficulty: "easy",
    },
    {
      question: "Design a system that handles 10× load spikes.",
      category: "system-design",
      skill_tested: "scalability",
      hint: "Consider horizontal scaling and caching.",
      difficulty: "hard",
    },
  ],
};

describe("InterviewPanel", () => {
  it("renders without crashing", () => {
    render(
      <InterviewPanel interview={INTERVIEW} onRegenerate={vi.fn()} regenerating={false} />
    );
    expect(screen.getByText("Mock Interview")).toBeInTheDocument();
  });

  it("shows question count", () => {
    render(
      <InterviewPanel interview={INTERVIEW} onRegenerate={vi.fn()} regenerating={false} />
    );
    expect(screen.getByText(/3 questions/)).toBeInTheDocument();
  });

  it("renders difficulty filter buttons", () => {
    render(
      <InterviewPanel interview={INTERVIEW} onRegenerate={vi.fn()} regenerating={false} />
    );
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
  });

  it("shows offline mode banner when used_fallback is true", () => {
    const fallbackInterview = { ...INTERVIEW, used_fallback: true };
    render(
      <InterviewPanel interview={fallbackInterview} onRegenerate={vi.fn()} regenerating={false} />
    );
    expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
  });

  it("does not show offline banner when used_fallback is false", () => {
    render(
      <InterviewPanel interview={INTERVIEW} onRegenerate={vi.fn()} regenerating={false} />
    );
    expect(screen.queryByText(/offline mode/i)).toBeNull();
  });

  it("calls onRegenerate when Regenerate button is clicked", async () => {
    const user = userEvent.setup();
    const mockRegen = vi.fn();
    render(
      <InterviewPanel interview={INTERVIEW} onRegenerate={mockRegen} regenerating={false} />
    );
    await user.click(screen.getByRole("button", { name: /regenerate/i }));
    expect(mockRegen).toHaveBeenCalledOnce();
  });

  it("reveals hint when accordion question is clicked", async () => {
    const user = userEvent.setup();
    render(
      <InterviewPanel interview={INTERVIEW} onRegenerate={vi.fn()} regenerating={false} />
    );
    // The Docker question has a hint; click its accordion button
    await user.click(screen.getByText("Explain Docker and its use in CI/CD pipelines."));
    expect(screen.getByText(/image layering/i)).toBeInTheDocument();
  });
});
