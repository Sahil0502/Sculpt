const slots = [
  { day: "Mon", times: ["9:00", "11:00"] },
  { day: "Tue", times: ["2:00", "4:00"] },
  { day: "Wed", times: ["10:00", "3:00"] },
  { day: "Thu", times: ["1:00", "5:00"] },
  { day: "Fri", times: ["9:30", "12:00"] },
];

export function Calendar() {
  return (
    <div className="grid gap-3 rounded-3xl border border-app-ink/10 bg-white/70 p-6 md:grid-cols-5">
      {slots.map((slot) => (
        <div key={slot.day} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-app-ink-soft">
            {slot.day}
          </p>
          {slot.times.map((time) => (
            <div
              key={time}
              className="rounded-xl border border-app-accent/20 bg-app-accent/10 px-3 py-2 text-sm"
            >
              {time}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
