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

export function TicketVolumeChart({
  data,
}: {
  data: { day: string; tickets: number }[];
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,74,0.6)" />
          <XAxis dataKey="day" stroke="#8888AA" tick={{ fill: "#8888AA", fontSize: 11 }} />
          <YAxis stroke="#8888AA" tick={{ fill: "#8888AA", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#14142B",
              border: "1px solid #2A2A4A",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#F0F0FF" }}
          />
          <Line
            type="monotone"
            dataKey="tickets"
            stroke="#E20074"
            strokeWidth={2}
            dot={{ fill: "#E20074", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
