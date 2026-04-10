"use client";

import { useEffect, useMemo, useState } from "react";

export function PitchAnalyzer({ stream }: { stream: MediaStream | null }) {
  const [bars, setBars] = useState<number[]>(Array.from({ length: 8 }, () => 10));

  useEffect(() => {
    if (!stream) {
      setBars(Array.from({ length: 8 }, () => 10));
      return undefined;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let frameId = 0;

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);

      const bucketSize = Math.floor(dataArray.length / 8) || 1;
      const nextBars = Array.from({ length: 8 }, (_, index) => {
        let total = 0;
        for (let i = 0; i < bucketSize; i += 1) {
          total += dataArray[index * bucketSize + i] || 0;
        }
        return 10 + total / bucketSize / 2;
      });

      setBars(nextBars);
      frameId = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.cancelAnimationFrame(frameId);
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [stream]);

  const intensity = useMemo(
    () => Math.round(bars.reduce((sum, value) => sum + value, 0) / bars.length),
    [bars]
  );

  return (
    <div className="space-y-3 rounded-3xl border border-app-ink/10 bg-white/70 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Pitch Signals</h3>
        <span className="text-xs text-app-ink-soft">
          {stream ? "Live" : "No mic"}
        </span>
      </div>
      <div className="flex items-end gap-2">
        {bars.map((value, index) => (
          <div
            key={`${value}-${index}`}
            className="w-4 rounded-full bg-app-accent/70"
            style={{ height: `${value}px` }}
          />
        ))}
      </div>
      <div className="text-xs text-app-ink-soft">Audio intensity {intensity}%</div>
    </div>
  );
}
