"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type GroupComparisonProps = {
  data: Array<Record<string, string | number>>;
  groups: string[];
};

const COLORS = [
  "#a3ff5e",
  "#65ff35",
  "#4ade80",
  "#22c55e",
  "#86efac",
  "#bbf7d0",
];

export function GroupComparison({ data, groups }: GroupComparisonProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="round" tick={{ fill: "#8ba389", fontSize: 11 }} />
        <YAxis tick={{ fill: "#8ba389", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#162016",
            border: "1px solid #1f3320",
            borderRadius: 12,
          }}
        />
        <Legend />
        {groups.slice(0, 6).map((g, i) => (
          <Line
            key={g}
            type="monotone"
            dataKey={g}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
