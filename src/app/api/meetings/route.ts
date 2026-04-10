import { NextResponse } from "next/server";

import { seedMeetings } from "@/seed/data";

export async function GET() {
  return NextResponse.json({ meetings: seedMeetings });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ meeting: { id: "meeting-new", ...body } }, { status: 201 });
}
