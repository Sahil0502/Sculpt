import { NextResponse } from "next/server";

import { generateAgenda } from "@/lib/openai";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const result = await generateAgenda(body.context || "");

    if (!result.items.length) {
      return NextResponse.json({
        agenda: [
          "Review last meeting action items",
          "Discuss discovery and GTM gaps",
          "Align on next sprint risks",
        ],
        source: "fallback",
        error: result.error || "empty_items",
      });
    }

    return NextResponse.json({ agenda: result.items, source: result.source });
  } catch {
    return NextResponse.json({
      agenda: [
        "Review last meeting action items",
        "Discuss discovery and GTM gaps",
        "Align on next sprint risks",
      ],
      source: "fallback",
      error: "request_failed",
    });
  }
}
