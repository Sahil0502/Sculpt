export function summarizePitch(samples: number[]) {
  if (!samples.length) {
    return {
      average: 0,
      min: 0,
      max: 0,
      variability: 0,
    };
  }

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const average = samples.reduce((total, value) => total + value, 0) / samples.length;
  const variance =
    samples.reduce((total, value) => total + Math.pow(value - average, 2), 0) /
    samples.length;

  return {
    average,
    min,
    max,
    variability: Math.min(1, Math.sqrt(variance) / (average || 1)),
  };
}
