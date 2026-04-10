"use client";

import { useEffect, useState } from "react";

import { ActionItemsList } from "@/components/insights/ActionItemsList";
import { BlindSpotRadar } from "@/components/insights/BlindSpotRadar";
import { CompetencyScores } from "@/components/insights/CompetencyScores";
import { HealthScore } from "@/components/insights/HealthScore";
import { SentimentChart } from "@/components/insights/SentimentChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActionItem = {
  description: string;
  assignee: string;
  competency_dimension: string;
  due_date: string;
  priority: string;
};

type CompetencyScore = {
  dimension: string;
  score: number;
  evidence: string;
};

type FeedbackEntry = {
  from: string;
  to: string;
  content: string;
  competency_dimension: string;
  sentiment: string;
};

type Analysis = {
  summary?: string;
  sentiment?: {
    manager: { overall: string };
    employee: { overall: string };
  };
  key_decisions?: string[];
  action_items?: ActionItem[];
  feedback?: FeedbackEntry[];
  competency_scores?: CompetencyScore[];
  blind_spots?: string[];
  engagement_analysis?: {
    manager_engagement: string;
    employee_engagement: string;
    conversation_balance: number;
    notable_moments: string[];
  };
  growth_insights?: string;
  next_meeting_suggestions?: string[];
};

const DEMO_ANALYSIS: Analysis = {
  summary:
    "Aligned on Q2 product discovery risks and sprint delivery. Identified GTM timeline gaps and agreed on escalation path for staffing blockers.",
  sentiment: {
    manager: { overall: "positive" },
    employee: { overall: "neutral" },
  },
  key_decisions: [
    "Move release planning sync to Monday",
    "Prioritise GTM readiness before next sprint kick-off",
    "Employee to own PRD draft end-to-end with manager review by Apr 15",
  ],
  action_items: [
    {
      description: "Ship PRD draft with GTM milestones",
      assignee: "employee",
      competency_dimension: "Execution",
      due_date: "2026-04-15",
      priority: "high",
    },
    {
      description: "Confirm staffing for discovery workstream",
      assignee: "manager",
      competency_dimension: "Leadership",
      due_date: "2026-04-15",
      priority: "medium",
    },
  ],
  feedback: [
    {
      from: "manager",
      to: "employee",
      content: "Great clarity on risks. Keep surfacing blockers early — it's making the team faster.",
      competency_dimension: "Communication",
      sentiment: "positive",
    },
    {
      from: "employee",
      to: "manager",
      content: "Appreciated the quick alignment on GTM scope. Helped unblock the design sprint.",
      competency_dimension: "Leadership",
      sentiment: "positive",
    },
  ],
  competency_scores: [
    {
      dimension: "Execution",
      score: 4,
      evidence: "Outlined concrete mitigation steps for launch blockers.",
    },
    {
      dimension: "Communication",
      score: 5,
      evidence: "Clear articulation of risks and cross-functional dependencies.",
    },
    {
      dimension: "GTM Strategy",
      score: 2,
      evidence: "GTM not discussed in sufficient depth — third consecutive meeting.",
    },
  ],
  blind_spots: [
    "GTM Strategy not discussed in 3 consecutive meetings",
    "Stakeholder management underexplored across all recent 1-on-1s",
  ],
  engagement_analysis: {
    manager_engagement: "high",
    employee_engagement: "medium",
    conversation_balance: 0.52,
    notable_moments: ["Elevated stress detected when discussing sprint deadlines"],
  },
  growth_insights:
    "Employee is showing strong improvement in follow-through on delivery plans. GTM coverage remains a persistent blind spot that warrants a dedicated agenda item next session.",
  next_meeting_suggestions: [
    "Deep dive on GTM milestones and launch readiness",
    "Review discovery backlog with design team input",
    "Stakeholder mapping exercise for Q2 launches",
  ],
};

function LiveActionItems({ items }: { items: ActionItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start justify-between rounded-2xl border border-app-ink/10 bg-white/70 p-4"
        >
          <div>
            <p className="text-sm font-semibold">{item.description}</p>
            <p className="mt-1 text-xs capitalize text-app-ink-soft">
              {item.assignee} · Due {item.due_date}
            </p>
          </div>
          <Badge>{item.priority}</Badge>
        </div>
      ))}
    </div>
  );
}

function LiveCompetencyScores({ scores }: { scores: CompetencyScore[] }) {
  return (
    <div className="space-y-3">
      {scores.map((s) => (
        <div key={s.dimension} className="rounded-2xl border border-app-ink/10 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{s.dimension}</p>
            <span className="text-sm text-app-ink-soft">{s.score}/5</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-app-ink/10">
            <div
              className="h-full rounded-full bg-app-accent"
              style={{ width: `${(s.score / 5) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-app-ink-soft">{s.evidence}</p>
        </div>
      ))}
    </div>
  );
}

export function InsightsDisplay({ meetingId }: { meetingId: string }) {
  const [analysis, setAnalysis] = useState<Analysis>(DEMO_ANALYSIS);
  const [source, setSource] = useState<"live" | "demo">("demo");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`analysis-${meetingId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Analysis;
        setAnalysis(parsed);
        setSource("live");
      }
    } catch {
      // fall back to demo data
    }
  }, [meetingId]);

  const healthScore = source === "live" ? 85 : 82;

  return (
    <div className="space-y-0">
      {/* Source badge */}
      {source === "live" && (
        <div className="mb-4 flex items-center gap-2">
          <Badge>Live Analysis</Badge>
          <span className="text-sm text-app-ink-soft">Generated from your meeting session</span>
        </div>
      )}

      {/* Summary + Key Decisions */}
      {analysis.summary ? (
        <div className="mb-6 rounded-3xl border border-app-ink/10 bg-white/70 p-6">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-app-ink-soft">
            Meeting Summary
          </p>
          <p className="text-sm">{analysis.summary}</p>
          {analysis.key_decisions?.length ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-app-ink-soft">
                Key Decisions
              </p>
              <ul className="space-y-1">
                {analysis.key_decisions.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-app-ink-soft">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-app-accent" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Sentiment + Health Score */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Meeting sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentChart />
            {analysis.engagement_analysis ? (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-app-ink/10 bg-white/60 p-3">
                  <p className="text-xs text-app-ink-soft">Manager</p>
                  <p className="mt-1 font-semibold capitalize">
                    {analysis.engagement_analysis.manager_engagement}
                  </p>
                </div>
                <div className="rounded-2xl border border-app-ink/10 bg-white/60 p-3">
                  <p className="text-xs text-app-ink-soft">Employee</p>
                  <p className="mt-1 font-semibold capitalize">
                    {analysis.engagement_analysis.employee_engagement}
                  </p>
                </div>
                {analysis.engagement_analysis.notable_moments?.[0] ? (
                  <div className="col-span-2 rounded-2xl border border-dashed border-app-ink/20 bg-white/60 p-3 text-xs text-app-ink-soft">
                    {analysis.engagement_analysis.notable_moments[0]}
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <HealthScore score={healthScore} />
          {analysis.sentiment ? (
            <div className="rounded-3xl border border-app-ink/10 bg-white/70 p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-app-ink-soft">
                Sentiment
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-app-ink-soft">Manager</span>
                  <Badge>{analysis.sentiment.manager.overall}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-app-ink-soft">Employee</span>
                  <Badge>{analysis.sentiment.employee.overall}</Badge>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Action Items + Competency Scores */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Action items</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.action_items ? (
              <LiveActionItems items={analysis.action_items} />
            ) : (
              <ActionItemsList />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Competency scores</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.competency_scores ? (
              <LiveCompetencyScores scores={analysis.competency_scores} />
            ) : (
              <CompetencyScores />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Blind Spots + Growth */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Blind spot radar</CardTitle>
          </CardHeader>
          <CardContent>
            <BlindSpotRadar />
            {analysis.blind_spots?.length ? (
              <div className="mt-3 space-y-2">
                {analysis.blind_spots.map((spot) => (
                  <div
                    key={spot}
                    className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50/60 px-3 py-2 text-sm text-app-ink-soft"
                  >
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />
                    {spot}
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Growth insight</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-app-ink-soft">{analysis.growth_insights}</p>
            {analysis.next_meeting_suggestions?.length ? (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-app-ink-soft">
                  Next meeting
                </p>
                <ul className="space-y-1">
                  {analysis.next_meeting_suggestions.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-app-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-app-accent-2" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Feedback Exchanges */}
      {analysis.feedback?.length ? (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feedback exchanges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.feedback.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-app-ink/10 bg-white/70 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.2em] text-app-ink-soft capitalize">
                        {f.from} → {f.to}
                      </span>
                      <Badge>{f.sentiment}</Badge>
                    </div>
                    <p className="text-sm">{f.content}</p>
                    <p className="mt-1 text-xs text-app-ink-soft">{f.competency_dimension}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
