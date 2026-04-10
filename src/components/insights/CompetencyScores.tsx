const scores = [
  { dimension: "Execution", score: 4, evidence: "Outlined mitigation steps." },
  { dimension: "Communication", score: 5, evidence: "Clear articulation of risks." },
  { dimension: "GTM", score: 2, evidence: "Needs deeper coverage." },
];

export function CompetencyScores() {
  return (
    <div className="space-y-3">
      {scores.map((score) => (
        <div key={score.dimension} className="rounded-2xl border border-app-ink/10 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{score.dimension}</p>
            <span className="text-sm text-app-ink-soft">{score.score}/5</span>
          </div>
          <p className="mt-2 text-sm text-app-ink-soft">{score.evidence}</p>
        </div>
      ))}
    </div>
  );
}
