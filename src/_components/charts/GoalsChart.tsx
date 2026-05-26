"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type GoalsChartProps = {
  data: Array<{ name: string; goals: number }>;
};

export function GoalsChart({ data }: GoalsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 60 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: "#8ba389", fontSize: 10 }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fill: "#8ba389", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#162016",
            border: "1px solid #1f3320",
            borderRadius: 12,
            color: "#f0fff0",
          }}
        />
        <Bar dataKey="goals" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i % 2 === 0 ? "#a3ff5e" : "#65ff35"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
