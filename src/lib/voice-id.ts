export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  const dot = a.reduce((sum, value, index) => sum + value * (b[index] || 0), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  if (!magnitudeA || !magnitudeB) {
    return 0;
  }

  return dot / (magnitudeA * magnitudeB);
}

export function averageEmbedding(frames: number[][]) {
  if (!frames.length) {
    return [] as number[];
  }

  const length = frames[0].length;
  const sums = new Array(length).fill(0);

  frames.forEach((frame) => {
    frame.forEach((value, index) => {
      sums[index] += value;
    });
  });

  return sums.map((value) => value / frames.length);
}
