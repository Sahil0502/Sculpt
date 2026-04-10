import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    query: body.query,
    results: [
      { id: "chunk-1", score: 0.82, content: "Discovery gaps from last meeting." },
      { id: "chunk-2", score: 0.78, content: "Action item: ship PRD by Apr 14." },
    ],
  });
}
