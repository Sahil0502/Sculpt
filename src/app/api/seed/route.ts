import { NextResponse } from "next/server";

import { seedActionItems, seedMeetings, seedUsers } from "@/seed/data";

export async function GET() {
  return NextResponse.json({
    users: seedUsers,
    meetings: seedMeetings,
    actionItems: seedActionItems,
  });
}
