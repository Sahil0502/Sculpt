"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { minute: "0", engagement: 0.45, stress: 0.2 },
  { minute: "5", engagement: 0.62, stress: 0.35 },
  { minute: "10", engagement: 0.7, stress: 0.28 },
  { minute: "15", engagement: 0.78, stress: 0.4 },
];

export function SentimentChart() {
  return (
    <div className="w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
          <XAxis dataKey="minute" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke="#f97316"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="stress"
            stroke="#0f766e"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
