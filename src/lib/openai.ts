import OpenAI from "openai";

import type { TranscriptEntry } from "./types";
import { agendaPrompt, meetingAnalysisPrompt } from "./prompts";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
const embeddingsModel =
  process.env.OPENAI_EMBEDDINGS_MODEL || "text-embedding-3-small";

const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function createEmbedding(input: string) {
  if (!client) {
    return [] as number[];
  }

  const response = await client.embeddings.create({
    model: embeddingsModel,
    input,
  });

  return response.data[0]?.embedding ?? [];
}

type AgendaResult = {
  items: string[];
  source: "openai" | "fallback";
  error?: string;
  rawText?: string;
};

function extractOutputText(response: unknown): string {
  const result = response as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (result.output_text) {
    return result.output_text;
  }

  const content = result.output?.[0]?.content || [];
  const text = content.map((item) => item.text).filter(Boolean).join("\n");
  return text || "";
}

export async function generateAgenda(context: string): Promise<AgendaResult> {
  if (!client) {
    return {
      items: [],
      source: "fallback",
      error: "missing_openai_key",
    };
  }

  const prompt = `${agendaPrompt}\nContext:\n${context}`;

  const response = await client.responses.create({
    model,
    input: prompt,
    text: {
      format: { type: "json_object" },
    },
  });

  const outputText = extractOutputText(response);

  try {
    const data = JSON.parse(outputText || "{}");
    const directItems = Array.isArray(data.items) ? data.items : [];
    const agendaItems = Array.isArray(data.agenda) ? data.agenda : [];
    const topics = Array.isArray(data.topics) ? data.topics : [];
    const asArray = Array.isArray(data) ? data : [];
    const items = [...directItems, ...agendaItems, ...topics, ...asArray].filter(
      (item) => typeof item === "string"
    );

    return {
      items,
      source: "openai",
      rawText: outputText,
      error: items.length ? undefined : "empty_items",
    };
  } catch {
    return {
      items: [],
      source: "openai",
      rawText: outputText,
      error: "json_parse_failed",
    };
  }
}

export async function analyzeMeeting(params: {
  transcript: TranscriptEntry[];
  pitchSummary: Record<string, unknown>;
  competencySnapshot: string;
}) {
  if (!client) {
    return {
      summary:
        "Discussed sprint outcomes, surfaced delivery risks, and aligned on next steps.",
      sentiment: {
        manager: { overall: "positive", confidence: 0.82 },
        employee: { overall: "neutral", confidence: 0.74 },
      },
      key_decisions: ["Move release planning to Monday"],
      action_items: [
        {
          description: "Share revised delivery plan",
          assignee: "employee",
          competency_dimension: "Execution",
          due_date: "2026-04-15",
          priority: "high",
        },
      ],
      feedback: [
        {
          from: "manager",
          to: "employee",
          content: "Great clarity on risks. Keep updating early.",
          competency_dimension: "Communication",
          sentiment: "positive",
        },
      ],
      competency_scores: [
        {
          dimension: "Execution",
          score: 4,
          evidence: "Outlined mitigation steps for launch blockers.",
        },
      ],
      blind_spots: ["GTM strategy"],
      engagement_analysis: {
        manager_engagement: "high",
        employee_engagement: "medium",
        conversation_balance: 0.52,
        notable_moments: ["Elevated stress during deadline talk"],
      },
      growth_insights: "Employee is improving follow-through on delivery plans.",
      next_meeting_suggestions: ["Deep dive on discovery backlog"],
    };
  }

  const prompt = `${meetingAnalysisPrompt}\nTranscript:${JSON.stringify(
    params.transcript
  )}\nPitch:${JSON.stringify(
    params.pitchSummary
  )}\nCompetencies:${params.competencySnapshot}`;

  const response = await client.responses.create({
    model,
    input: prompt,
    text: { format: { type: "json_object" } },
  });

  try {
    const outputText = (response as { output_text?: string }).output_text || "";
    return JSON.parse(outputText || "{}");
  } catch {
    return {};
  }
}
