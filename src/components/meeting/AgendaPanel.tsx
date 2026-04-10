"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

const FALLBACK_ITEMS = [
  "Review action items from last session",
  "Discuss discovery gaps and customer feedback",
  "Align on Q2 roadmap risks",
  "Career growth and mentorship plan",
];

export function AgendaPanel({ meetingId }: { meetingId?: string }) {
  const [items, setItems] = useState<string[]>(FALLBACK_ITEMS);
  const [source, setSource] = useState<"loading" | "api" | "fallback">("loading");

  useEffect(() => {
    const context = meetingId
      ? `Meeting ${meetingId}. Employee: Arjun Rao, PM Level 1. Manager: Priya Shah, Director of Product. Previous action items: Ship PRD draft (in progress), Review staffing plan (pending). Focus areas: Execution, GTM Strategy.`
      : "1-on-1 performance meeting between manager and employee.";

    fetch("/api/agenda/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    })
      .then((r) => r.json())
      .then((data: { agenda?: string[]; source?: string }) => {
        if (Array.isArray(data.agenda) && data.agenda.length > 0) {
          setItems(data.agenda);
          setSource(data.source === "openai" ? "api" : "fallback");
        } else {
          setSource("fallback");
        }
      })
      .catch(() => {
        setSource("fallback");
      });
  }, [meetingId]);

  return (
    <div className="space-y-4 rounded-3xl border border-app-ink/10 bg-white/70 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">AI Agenda</h3>
        <Badge>{source === "api" ? "GPT" : source === "loading" ? "Loading…" : "RAG"}</Badge>
      </div>
      <ul className="space-y-3 text-sm text-app-ink-soft">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-app-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-app-ink/20 bg-white/60 p-3 text-xs text-app-ink-soft">
        Carry-over: Ship PRD draft, finalise GTM alignment.
      </div>
    </div>
  );
}
