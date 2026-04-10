import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    status: "stored",
    embeddingSize: Array.isArray(body.embedding) ? body.embedding.length : 0,
  });
}
