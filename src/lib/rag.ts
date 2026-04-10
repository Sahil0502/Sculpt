import { createEmbedding } from "./openai";

export function chunkText(text: string, maxWords = 120, overlap = 20) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += maxWords - overlap) {
    const slice = words.slice(i, i + maxWords);
    if (slice.length) {
      chunks.push(slice.join(" "));
    }
  }

  return chunks;
}

export async function embedChunks(chunks: string[]) {
  const embeddings = [] as number[][];

  for (const chunk of chunks) {
    embeddings.push(await createEmbedding(chunk));
  }

  return embeddings;
}
