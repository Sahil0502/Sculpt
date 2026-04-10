import { NextResponse } from "next/server";

import { chunkText, embedChunks } from "@/lib/rag";

export async function POST(request: Request) {
  const body = await request.json();
  const chunks = chunkText(body.content || "");

  try {
    const embeddings = await embedChunks(chunks);
    return NextResponse.json({ chunks, embeddings });
  } catch {
    return NextResponse.json({
      chunks,
      embeddings: chunks.map(() => []),
      fallback: true,
    });
  }
}
