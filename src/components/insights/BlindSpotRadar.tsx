"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const data = [
  { dimension: "Discovery", score: 4 },
  { dimension: "GTM", score: 1 },
  { dimension: "Execution", score: 5 },
  { dimension: "Leadership", score: 3 },
  { dimension: "Stakeholders", score: 2 },
];

export function BlindSpotRadar() {
  return (
    <div className="w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} outerRadius={80}>
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" />
          <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
