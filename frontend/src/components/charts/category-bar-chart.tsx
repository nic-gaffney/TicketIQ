"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function CategoryBarChart({
  data,
}: {
  data: { category: string; count: number }[];
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,74,0.6)" />
          <XAxis type="number" stroke="#8888AA" tick={{ fill: "#8888AA", fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="category"
            width={120}
            stroke="#8888AA"
            tick={{ fill: "#8888AA", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: "#14142B",
              border: "1px solid #2A2A4A",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="count" fill="#E20074" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
