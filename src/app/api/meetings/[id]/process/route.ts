import { NextResponse } from "next/server";

import { analyzeMeeting } from "@/lib/openai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const analysis = await analyzeMeeting({
    transcript: body.transcript || [],
    pitchSummary: body.pitchSummary || {},
    competencySnapshot: body.competencySnapshot || "",
  });

  return NextResponse.json({ meetingId: id, analysis });
}
