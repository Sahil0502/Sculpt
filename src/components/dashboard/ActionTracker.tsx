const actions = [
  { label: "Ship PRD draft", status: "In progress" },
  { label: "Review staffing plan", status: "Pending" },
  { label: "Run customer interviews", status: "Completed" },
];

export function ActionTracker() {
  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div key={action.label} className="flex items-center justify-between rounded-2xl border border-app-ink/10 bg-white/70 p-4">
          <p className="font-semibold">{action.label}</p>
          <span className="text-xs text-app-ink-soft">{action.status}</span>
        </div>
      ))}
    </div>
  );
}
