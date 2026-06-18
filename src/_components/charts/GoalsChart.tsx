"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

type GoalsChartProps = {
  data: Array<{ name: string; goals: number }>;
  height?: number;
};

export function GoalsChart({ data, height = 280 }: GoalsChartProps) {
  const chartHeight = Math.max(height, data.length * 28);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        margin={{ top: 16, right: 8, left: -20, bottom: 60 }}
      >
        <XAxis
          dataKey="name"
          tick={{ fill: "#8ba389", fontSize: 10 }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fill: "#8ba389", fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "#162016",
            border: "1px solid #1f3320",
            borderRadius: 12,
            color: "#f0fff0",
          }}
        />
        <Bar dataKey="goals" radius={[6, 6, 0, 0]}>
          <LabelList
            dataKey="goals"
            position="top"
            fill="#f0fff0"
            fontSize={11}
          />
          {data.map((_, i) => (
            <Cell key={i} fill={i % 2 === 0 ? "#a3ff5e" : "#65ff35"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
