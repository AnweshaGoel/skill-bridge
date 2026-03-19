import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SkillGapChart } from "../components/SkillGapChart";
import type { SkillGap } from "../types";

// Recharts uses ResizeObserver internally; stub it for jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const SKILLS: SkillGap[] = [
  { skill: "Python", category: "technical", status: "present", importance: "critical", user_evidence: "Python 3 years" },
  { skill: "Kubernetes", category: "tool", status: "missing", importance: "important", user_evidence: null },
  { skill: "Docker", category: "tool", status: "partial", importance: "critical", user_evidence: "basic usage" },
];

describe("SkillGapChart", () => {
  it("renders without crashing with a non-empty skills array", () => {
    const { container } = render(<SkillGapChart skills={SKILLS} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders without crashing with an empty skills array", () => {
    const { container } = render(<SkillGapChart skills={[]} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders a Recharts responsive container wrapper", () => {
    const { container } = render(<SkillGapChart skills={SKILLS} />);
    // ResponsiveContainer renders a div with style width/height
    const wrapper = container.querySelector(".recharts-responsive-container");
    expect(wrapper).not.toBeNull();
  });

  it("renders with a single skill without crashing", () => {
    const single: SkillGap[] = [
      { skill: "Go", category: "technical", status: "missing", importance: "important", user_evidence: null },
    ];
    const { container } = render(<SkillGapChart skills={single} />);
    expect(container.firstChild).not.toBeNull();
  });
});
