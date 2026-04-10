export function HealthScore({ score }: { score: number }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-app-ink/10 bg-white/70 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-app-ink-soft">
          Health score
        </p>
        <p className="font-display text-3xl font-semibold">{score}%</p>
        <p className="text-sm text-app-ink-soft">Coverage, actionability, and follow-through.</p>
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-app-accent/30">
        <span className="text-lg font-semibold text-app-accent">{score}</span>
      </div>
    </div>
  );
}
