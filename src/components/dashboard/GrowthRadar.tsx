"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const data = [
  { dimension: "Discovery", score: 3 },
  { dimension: "Execution", score: 4 },
  { dimension: "Leadership", score: 3.5 },
  { dimension: "Strategy", score: 4 },
  { dimension: "GTM", score: 2.5 },
];

export function GrowthRadar() {
  return (
    <div className="w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} outerRadius={80}>
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" />
          <Radar dataKey="score" stroke="#0f766e" fill="#0f766e" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
