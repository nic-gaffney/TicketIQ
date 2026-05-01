"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AIAccuracyTrend({
  data,
}: {
  data: { week: string; accuracy: number }[];
}) {
  const pct = data.map((d) => ({
    ...d,
    pct: Math.round(d.accuracy * 100),
  }));
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pct} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,74,0.6)" />
          <XAxis dataKey="week" stroke="#8888AA" tick={{ fill: "#8888AA", fontSize: 11 }} />
          <YAxis
            domain={[80, 100]}
            stroke="#8888AA"
            tick={{ fill: "#8888AA", fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#14142B",
              border: "1px solid #2A2A4A",
              borderRadius: 8,
            }}
            formatter={(v: number) => [`${v}%`, "Accuracy"]}
          />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="#FF4DA6"
            strokeWidth={2}
            dot={{ fill: "#FF4DA6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
