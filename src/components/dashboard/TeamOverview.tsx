const team = [
  { name: "Arjun Rao", nextMeeting: "Apr 10, 4:00 PM" },
  { name: "Lena Chen", nextMeeting: "Apr 11, 2:30 PM" },
  { name: "Marco Diaz", nextMeeting: "Apr 12, 10:00 AM" },
];

export function TeamOverview() {
  return (
    <div className="space-y-3">
      {team.map((member) => (
        <div key={member.name} className="flex items-center justify-between rounded-2xl border border-app-ink/10 bg-white/70 p-4">
          <div>
            <p className="font-semibold">{member.name}</p>
            <p className="text-xs text-app-ink-soft">Next: {member.nextMeeting}</p>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-app-ink-soft">Ready</span>
        </div>
      ))}
    </div>
  );
}
