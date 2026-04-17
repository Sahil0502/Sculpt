"use client";

import { useEffect, useState } from "react";

import { BlindSpotRadar } from "@/components/insights/BlindSpotRadar";
import { SentimentChart } from "@/components/insights/SentimentChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ─── types ─────────────────────────────────────────────────────────────── */

type ActionItem = {
  description?: string;
  title?: string;       // GPT sometimes returns "title" instead of "description"
  task?: string;
  assignee?: string;
  owner?: string;
  competency_dimension?: string;
  due_date?: string;
  dueDate?: string;
  priority?: string;
};

type CompetencyScore = {
  dimension?: string;
  name?: string;
  score?: number;
  rating?: number;
  evidence?: string;
  justification?: string;
};

type FeedbackEntry = {
  from?: string;
  to?: string;
  content?: string;
  message?: string;
  competency_dimension?: string;
  sentiment?: string;
};

type Analysis = {
  summary?: string;
  overview?: string;
  sentiment?: {
    manager?: { overall?: string };
    employee?: { overall?: string };
  };
  key_decisions?: string[];
  decisions?: string[];
  action_items?: ActionItem[];
  actionItems?: ActionItem[];
  feedback?: FeedbackEntry[];
  competency_scores?: CompetencyScore[];
  competencyScores?: CompetencyScore[];
  blind_spots?: string[];
  blindSpots?: string[];
  engagement_analysis?: {
    manager_engagement?: string;
    employee_engagement?: string;
    conversation_balance?: number;
    notable_moments?: string[];
  };
  growth_insights?: string;
  growthInsights?: string;
  next_meeting_suggestions?: string[];
  nextMeetingSuggestions?: string[];
};

/* ─── rich demo data ─────────────────────────────────────────────────────── */

const DEMO: Required<Omit<Analysis, "overview" | "decisions" | "actionItems" | "competencyScores" | "blindSpots" | "growthInsights" | "nextMeetingSuggestions">> = {
  summary:
    "Aligned on Q2 product discovery risks and sprint delivery timelines. Identified GTM strategy as a recurring blind spot not covered in the last three 1-on-1s. Employee demonstrated strong execution on PRD delivery but needs deeper cross-functional stakeholder engagement.",
  sentiment: {
    manager: { overall: "positive" },
    employee: { overall: "neutral" },
  },
  key_decisions: [
    "Move weekly release planning sync to Monday to catch blockers earlier",
    "Employee owns the GTM milestone plan end-to-end — due before next 1-on-1",
    "Escalate API team dependency to leadership sync on Apr 17",
  ],
  action_items: [
    { description: "Ship PRD draft with GTM milestones", assignee: "employee", competency_dimension: "Execution", due_date: "2026-04-17", priority: "high" },
    { description: "Confirm discovery workstream staffing with HR", assignee: "manager", competency_dimension: "Leadership", due_date: "2026-04-17", priority: "medium" },
    { description: "Escalate API dependency risk to leadership sync", assignee: "manager", competency_dimension: "Stakeholder Management", due_date: "2026-04-17", priority: "high" },
    { description: "Schedule GTM alignment session with Sales", assignee: "employee", competency_dimension: "GTM Strategy", due_date: "2026-04-20", priority: "medium" },
  ],
  feedback: [
    { from: "manager", to: "employee", content: "Excellent clarity on sprint risks. Keep surfacing blockers early — it's making the whole team move faster.", competency_dimension: "Communication", sentiment: "positive" },
    { from: "manager", to: "employee", content: "GTM thinking needs to go deeper. Three meetings without discussing launch readiness is a pattern we need to break.", competency_dimension: "GTM Strategy", sentiment: "constructive" },
    { from: "employee", to: "manager", content: "Really appreciated the quick decision on release planning. Removes a lot of ambiguity for the team.", competency_dimension: "Leadership", sentiment: "positive" },
  ],
  competency_scores: [
    { dimension: "Execution", score: 4, evidence: "Outlined concrete mitigation steps for launch blockers. Delivery on PRD milestone ahead of schedule." },
    { dimension: "Communication", score: 5, evidence: "Clear articulation of risks and cross-functional dependencies. Manager noted 'excellent clarity.'" },
    { dimension: "GTM Strategy", score: 2, evidence: "GTM not discussed in depth — third consecutive meeting. Launch readiness not addressed." },
    { dimension: "Product Discovery", score: 3, evidence: "Customer interview pipeline set up but insights synthesis still pending." },
    { dimension: "Stakeholder Management", score: 2, evidence: "API dependency raised but escalation path not defined until prompted." },
  ],
  blind_spots: [
    "GTM Strategy — not discussed in 3 consecutive 1-on-1s",
    "Stakeholder Management — external alignment rarely proactively raised",
    "Leadership presence — no mention of team development or mentoring this session",
  ],
  engagement_analysis: {
    manager_engagement: "high",
    employee_engagement: "medium",
    conversation_balance: 0.42,   // employee spoke ~42% of the time
    notable_moments: [
      "Elevated stress detected when discussing sprint deadline — employee's pitch rose 18% above baseline",
      "High engagement from both parties during GTM discussion — marked inflection",
      "Employee initiated risk topic unprompted — positive signal for psychological safety",
    ],
  },
  growth_insights:
    "Arjun is demonstrating consistent growth in Execution and Communication — two of the five core competencies for PM Level 1. Delivery follow-through has improved across all three recent 1-on-1s. However, strategic dimensions (GTM, Stakeholder Management) are consistently absent from the conversation. At the current pace, a promotion to PM Level 2 is achievable in Q3 if GTM ownership becomes a demonstrated strength.",
  next_meeting_suggestions: [
    "Dedicated GTM readiness review — launch criteria, success metrics, sales enablement",
    "Stakeholder mapping exercise for Q2 launches",
    "Retrospective on Q1 discovery sprint — what worked, what to change",
    "Career conversation: competency gaps and development plan toward PM Level 2",
  ],
};

/* ─── normaliser — handles varying GPT field names ───────────────────────── */

function normalise(raw: Analysis): typeof DEMO {
  const items: ActionItem[] = raw.action_items ?? raw.actionItems ?? [];
  const scores: CompetencyScore[] = raw.competency_scores ?? raw.competencyScores ?? [];
  const feedback: FeedbackEntry[] = raw.feedback ?? [];
  const blindSpots: string[] = raw.blind_spots ?? raw.blindSpots ?? [];
  const decisions: string[] = raw.key_decisions ?? raw.decisions ?? [];
  const suggestions: string[] = raw.next_meeting_suggestions ?? raw.nextMeetingSuggestions ?? [];
  const growth: string = raw.growth_insights ?? raw.growthInsights ?? "";

  return {
    summary: raw.summary ?? raw.overview ?? DEMO.summary,
    sentiment: raw.sentiment ?? DEMO.sentiment,
    key_decisions: decisions.length ? decisions : DEMO.key_decisions,
    action_items: items.length
      ? items.map(i => ({
          description: i.description ?? i.title ?? i.task ?? "Action item",
          assignee: i.assignee ?? i.owner ?? "employee",
          competency_dimension: i.competency_dimension ?? "",
          due_date: i.due_date ?? i.dueDate ?? "2026-04-17",
          priority: i.priority ?? "medium",
        }))
      : DEMO.action_items,
    feedback: feedback.length
      ? feedback.map(f => ({
          from: f.from ?? "manager",
          to: f.to ?? "employee",
          content: f.content ?? f.message ?? "",
          competency_dimension: f.competency_dimension ?? "",
          sentiment: f.sentiment ?? "neutral",
        }))
      : DEMO.feedback,
    competency_scores: scores.length
      ? scores.map(s => ({
          dimension: s.dimension ?? s.name ?? "Competency",
          score: s.score ?? s.rating ?? 3,
          evidence: s.evidence ?? s.justification ?? "",
        }))
      : DEMO.competency_scores,
    blind_spots: blindSpots.length ? blindSpots : DEMO.blind_spots,
    engagement_analysis: raw.engagement_analysis ?? DEMO.engagement_analysis,
    growth_insights: growth || DEMO.growth_insights,
    next_meeting_suggestions: suggestions.length ? suggestions : DEMO.next_meeting_suggestions,
  };
}

/* ─── sub-components ─────────────────────────────────────────────────────── */

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  constructive: "bg-amber-100 text-amber-700",
  neutral: "bg-zinc-100 text-zinc-600",
  negative: "bg-red-100 text-red-700",
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round((Math.max(1, Math.min(5, score)) / 5) * 100);
  const color = score >= 4 ? "bg-app-accent-2" : score === 3 ? "bg-app-accent" : "bg-red-400";
  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-app-ink/10">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ConversationBalance({ balance }: { balance: number }) {
  const empPct = Math.round(balance * 100);
  const mgPct = 100 - empPct;
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-app-ink-soft">Talk time</p>
      <div className="flex h-3 overflow-hidden rounded-full">
        <div className="bg-app-accent transition-all" style={{ width: `${mgPct}%` }} title={`Manager ${mgPct}%`} />
        <div className="bg-app-accent-2 transition-all" style={{ width: `${empPct}%` }} title={`Employee ${empPct}%`} />
      </div>
      <div className="flex justify-between text-xs text-app-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-app-accent" />Manager {mgPct}%</span>
        <span className="flex items-center gap-1.5">Employee {empPct}%<span className="h-2 w-2 rounded-full bg-app-accent-2" /></span>
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */

export function InsightsDisplay({ meetingId }: { meetingId: string }) {
  const [data, setData] = useState<ReturnType<typeof normalise>>(DEMO);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`analysis-${meetingId}`);
      if (stored) {
        const raw = JSON.parse(stored) as Analysis;
        setData(normalise(raw));
        setIsLive(true);
      }
    } catch {
      // use DEMO
    }
    setLoading(false);
  }, [meetingId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-ink/20 border-t-app-accent" />
      </div>
    );
  }

  const eng = data.engagement_analysis;

  return (
    <div className="space-y-6">

      {/* Source badge */}
      {isLive && (
        <div className="flex items-center gap-2">
          <Badge>Live Analysis</Badge>
          <span className="text-sm text-app-ink-soft">Generated from your meeting session</span>
        </div>
      )}

      {/* ── Summary ── */}
      <div className="rounded-3xl border border-app-ink/10 bg-white/70 p-6">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-app-ink-soft">Meeting Summary</p>
        <p className="leading-relaxed text-sm">{data.summary}</p>

        {data.key_decisions.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-app-ink-soft">Key Decisions</p>
            <ul className="space-y-2">
              {data.key_decisions.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-app-accent" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Sentiment + Health ── */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <Card>
          <CardHeader><CardTitle>Meeting sentiment</CardTitle></CardHeader>
          <CardContent>
            <SentimentChart />
            {eng && (
              <div className="mt-5 space-y-4">
                <ConversationBalance balance={eng.conversation_balance ?? 0.42} />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-app-ink/10 bg-white/60 p-3">
                    <p className="text-xs text-app-ink-soft">Manager engagement</p>
                    <p className="mt-1 font-semibold capitalize">{eng.manager_engagement ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-app-ink/10 bg-white/60 p-3">
                    <p className="text-xs text-app-ink-soft">Employee engagement</p>
                    <p className="mt-1 font-semibold capitalize">{eng.employee_engagement ?? "—"}</p>
                  </div>
                </div>
                {(eng.notable_moments ?? []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-ink-soft">Notable moments</p>
                    {(eng.notable_moments ?? []).map((m, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-2xl border border-dashed border-app-ink/20 bg-white/50 px-3 py-2 text-xs text-app-ink-soft">
                        <span className="mt-0.5 text-app-accent">◈</span>
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Health score */}
          <div className="rounded-3xl border border-app-ink/10 bg-white/70 p-6">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-app-ink-soft">Health score</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-4xl font-semibold">82%</p>
                <p className="mt-1 text-sm text-app-ink-soft">Coverage · Actionability · Follow-through</p>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-app-accent/30">
                <span className="text-xl font-semibold text-app-accent">82</span>
              </div>
            </div>
          </div>

          {/* Sentiment summary */}
          {data.sentiment && (
            <div className="rounded-3xl border border-app-ink/10 bg-white/70 p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-app-ink-soft">Sentiment</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-app-ink-soft">Manager</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${SENTIMENT_COLOR[data.sentiment.manager?.overall ?? "neutral"] ?? SENTIMENT_COLOR.neutral}`}>
                    {data.sentiment.manager?.overall ?? "neutral"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-app-ink-soft">Employee</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${SENTIMENT_COLOR[data.sentiment.employee?.overall ?? "neutral"] ?? SENTIMENT_COLOR.neutral}`}>
                    {data.sentiment.employee?.overall ?? "neutral"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Competency Scores ── */}
      <Card>
        <CardHeader><CardTitle>Competency scores</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.competency_scores.map((s, i) => (
              <div key={i} className="rounded-2xl border border-app-ink/10 bg-white/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{s.dimension}</p>
                  <span className="text-sm font-semibold text-app-ink-soft">{s.score}/5</span>
                </div>
                <ScoreBar score={s.score ?? 3} />
                {s.evidence && <p className="mt-2 text-xs text-app-ink-soft leading-relaxed">{s.evidence}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Action Items ── */}
      <Card>
        <CardHeader><CardTitle>Action items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.action_items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-2xl border border-app-ink/10 bg-white/60 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{item.description}</p>
                  <p className="mt-1 text-xs text-app-ink-soft capitalize">
                    <span className="font-medium">{item.assignee}</span>
                    {item.competency_dimension ? ` · ${item.competency_dimension}` : ""}
                    {item.due_date ? ` · Due ${item.due_date}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${PRIORITY_COLOR[item.priority ?? "medium"] ?? PRIORITY_COLOR.medium}`}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Blind Spots + Growth ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader><CardTitle>Blind spot radar</CardTitle></CardHeader>
          <CardContent>
            <BlindSpotRadar />
            <div className="mt-4 space-y-2">
              {data.blind_spots.map((spot, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-app-ink-soft">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                  {spot}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Growth insight</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-app-ink-soft">{data.growth_insights}</p>
            {data.next_meeting_suggestions.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-app-ink-soft">Next meeting agenda</p>
                <ul className="space-y-2">
                  {data.next_meeting_suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-app-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-app-accent-2" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Feedback exchanges ── */}
      {data.feedback.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Feedback exchanges</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.feedback.map((f, i) => (
                <div key={i} className="rounded-2xl border border-app-ink/10 bg-white/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-app-ink-soft capitalize">
                      {f.from} → {f.to}
                      {f.competency_dimension ? ` · ${f.competency_dimension}` : ""}
                    </span>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${SENTIMENT_COLOR[f.sentiment ?? "neutral"] ?? SENTIMENT_COLOR.neutral}`}>
                      {f.sentiment}
                    </span>
                  </div>
                  <p className="text-sm">{f.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
