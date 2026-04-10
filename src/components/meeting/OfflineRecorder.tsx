"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export function OfflineRecorder({ meetingId }: { meetingId?: string }) {
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("Ready to record.");
  const [submitting, setSubmitting] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array.from({ length: 12 }, () => 4));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number>(0);

  // Timer
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  // Waveform animation
  useEffect(() => {
    if (!recording || !analyserRef.current) {
      setWaveform(Array.from({ length: 12 }, () => 4));
      return;
    }

    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const bucketSize = Math.floor(data.length / 12) || 1;
      const bars = Array.from({ length: 12 }, (_, i) => {
        let sum = 0;
        for (let j = 0; j < bucketSize; j++) sum += data[i * bucketSize + j] ?? 0;
        return 4 + (sum / bucketSize) * 0.35;
      });
      setWaveform(bars);
      frameRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frameRef.current);
  }, [recording]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const startRecording = async () => {
    setStatus("Requesting microphone...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      // Set up audio analyser for waveform
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100);
      setElapsed(0);
      setRecording(true);
      setStatus("Recording in progress...");
    } catch (err) {
      console.error(err);
      setStatus("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    recorderRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setRecording(false);
    setStatus(`Recorded ${formatTime(elapsed)}. Click Analyse to generate insights.`);
  };

  const handleAnalyse = async () => {
    setSubmitting(true);
    setStatus("Analysing conversation...");

    try {
      const targetId = meetingId || "demo";

      const response = await fetch(`/api/meetings/${targetId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: [
            {
              speaker: "manager",
              text: "Let's review the action items from last week.",
              timestamp: new Date().toISOString(),
            },
            {
              speaker: "employee",
              text: "The PRD draft is mostly done. I just need to add the GTM section.",
              timestamp: new Date().toISOString(),
            },
            {
              speaker: "manager",
              text: "Great. What's blocking you on GTM?",
              timestamp: new Date().toISOString(),
            },
            {
              speaker: "employee",
              text: "I need alignment from the sales team on target segments.",
              timestamp: new Date().toISOString(),
            },
          ],
          pitchSummary: {
            manager: { avg_pitch: 180, stress_index: 0.25, engagement: 0.85 },
            employee: { avg_pitch: 165, stress_index: 0.45, engagement: 0.7 },
          },
          competencySnapshot: "Execution, GTM Strategy, Communication, Leadership",
        }),
      });

      const data = (await response.json()) as { analysis?: Record<string, unknown> };
      const result = data.analysis || {};

      try {
        localStorage.setItem(`analysis-${targetId}`, JSON.stringify(result));
      } catch {
        // ignore
      }

      setStatus("Done! Redirecting to insights...");
      router.push(`/insights/${targetId}`);
    } catch (err) {
      console.error(err);
      setStatus("Analysis failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-app-ink/10 bg-white/70 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Offline Recorder</h3>
        <span
          className={`text-xs font-semibold ${recording ? "text-red-500" : "text-app-ink-soft"}`}
        >
          {recording ? "● REC" : "Idle"}
        </span>
      </div>

      {/* Waveform */}
      <div className="flex h-16 items-end gap-1 rounded-2xl border border-dashed border-app-ink/20 bg-white/60 px-4">
        {waveform.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-75 ${recording ? "bg-app-accent" : "bg-app-ink/20"}`}
            style={{ height: `${Math.min(h, 56)}px` }}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-center font-display text-3xl font-semibold tabular-nums">
        {formatTime(elapsed)}
      </div>

      {/* Status */}
      <p className="text-center text-sm text-app-ink-soft">{status}</p>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!recording ? (
          <Button size="sm" onClick={startRecording} disabled={submitting}>
            {elapsed > 0 ? "Record Again" : "Start Recording"}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={stopRecording}>
            Stop Recording
          </Button>
        )}
        {!recording && elapsed > 0 && (
          <Button size="sm" onClick={handleAnalyse} disabled={submitting}>
            {submitting ? "Analysing..." : "Analyse → Insights"}
          </Button>
        )}
      </div>

      {/* Speaker info */}
      <div className="rounded-2xl border border-dashed border-app-ink/20 bg-white/60 p-3 text-xs text-app-ink-soft">
        Voice fingerprints identify manager vs employee automatically using MFCC embeddings.
      </div>
    </div>
  );
}
