import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SkillGap } from "../types";

interface SkillGapChartProps {
  skills: SkillGap[];
}

const STATUS_COLOR: Record<string, string> = {
  present: "#16A34A",
  partial: "#D97706",
  missing: "#DC2626",
};

const STATUS_VALUE: Record<string, number> = {
  present: 100,
  partial: 55,
  missing: 18,
};

interface TooltipPayload {
  name: string;
  value: number;
  payload: { status: string; importance: string };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-[var(--text-primary)]">{d.name}</p>
      <p className="text-[var(--text-secondary)] capitalize mt-0.5">
        {d.payload.status} · {d.payload.importance}
      </p>
    </div>
  );
}

export function SkillGapChart({ skills }: SkillGapChartProps) {
  const data = skills.map((s) => ({
    name: s.skill,
    value: STATUS_VALUE[s.status] ?? 20,
    fill: STATUS_COLOR[s.status] ?? "#94A3B8",
    status: s.status,
    importance: s.importance,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 28)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
        barSize={14}
      >
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 11, fill: "var(--text-secondary)", fontFamily: "JetBrains Mono, monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-secondary)" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
