"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const options = ["Apr 10 - 4:00 PM", "Apr 11 - 2:30 PM", "Apr 12 - 10:00 AM"];

export function TimeSlotPicker() {
  const [selected, setSelected] = useState(options[0]);

  return (
    <div className="space-y-4 rounded-3xl border border-app-ink/10 bg-white/70 p-6">
      <h3 className="font-display text-lg font-semibold">Pick a slot</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
              selected === option
                ? "border-app-accent bg-app-accent/10"
                : "border-app-ink/10 bg-white/70"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <Button size="sm">Request Meeting</Button>
    </div>
  );
}
