"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Meyda from "meyda";

import { averageEmbedding, cosineSimilarity } from "@/lib/voice-id";

const AGENDA_ITEMS = [
  "Review action items from Apr 3 — PRD draft status, staffing plan",
  "GTM strategy alignment (flagged as blind spot in last 2 meetings)",
  "Discovery sprint proposal for Q2 onboarding",
  "API dependency risk — escalation decision",
  "Career growth: competency gaps and next milestone",
];

type Panel = "none" | "agenda";

export function OfflineRoom({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const meydaRef = useRef<ReturnType<typeof Meyda.createMeydaAnalyzer> | null>(null);
  const mfccFramesRef = useRef<number[][]>([]);
  const frameRef = useRef<number>(0);

  const [status, setStatus] = useState<"idle" | "recording" | "ending">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array.from({ length: 20 }, () => 3));
  const [panel, setPanel] = useState<Panel>("none");
  const [mediaError, setMediaError] = useState("");
  const [endingMsg, setEndingMsg] = useState("");
  const [speakerLog, setSpeakerLog] = useState<
    { speaker: "manager" | "employee" | "unknown"; similarity: number }[]
  >([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<"manager" | "employee" | "unknown">(
    "unknown"
  );

  // Timer
  useEffect(() => {
    if (status !== "recording") return;
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Waveform
  useEffect(() => {
    if (status !== "recording" || !analyserRef.current) {
      setWaveform(Array.from({ length: 20 }, () => 3));
      return;
    }
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const bucket = Math.floor(data.length / 20) || 1;
      setWaveform(Array.from({ length: 20 }, (_, i) => {
        let sum = 0;
        for (let j = 0; j < bucket; j++) sum += data[i * bucket + j] ?? 0;
        return 3 + (sum / bucket) * 0.4;
      }));
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frameRef.current);
  }, [status]);

  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    meydaRef.current?.stop();
  }, []);

  useEffect(() => {
    if (status !== "recording") return;

    const timer = setInterval(() => {
      if (!mfccFramesRef.current.length) return;

      const embedding = averageEmbedding(mfccFramesRef.current);
      mfccFramesRef.current = [];

      let employeeEmbedding: number[] | null = null;
      let managerEmbedding: number[] | null = null;

      try {
        const stored = localStorage.getItem("sculpt-voice-embedding");
        employeeEmbedding = stored ? (JSON.parse(stored) as number[]) : null;
      } catch {
        employeeEmbedding = null;
      }

      try {
        const storedManager = localStorage.getItem("sculpt-voice-embedding-manager");
        managerEmbedding = storedManager ? (JSON.parse(storedManager) as number[]) : null;
      } catch {
        managerEmbedding = null;
      }

      if (!employeeEmbedding?.length) {
        setCurrentSpeaker("unknown");
        setSpeakerLog((prev) => [
          ...prev,
          { speaker: "unknown", similarity: 0 },
        ]);
        return;
      }

      if (!managerEmbedding?.length) {
        managerEmbedding = employeeEmbedding.map((v, i) => v * (0.92 + (i % 3) * 0.01));
      }

      const employeeSim = cosineSimilarity(embedding, employeeEmbedding);
      const managerSim = cosineSimilarity(embedding, managerEmbedding);
      const maxSim = Math.max(employeeSim, managerSim);

      let speaker: "manager" | "employee" | "unknown" = "unknown";
      if (maxSim >= 0.6) {
        speaker = employeeSim >= managerSim ? "employee" : "manager";
      }

      setCurrentSpeaker(speaker);
      setSpeakerLog((prev) => [
        ...prev,
        { speaker, similarity: Number(maxSim.toFixed(2)) },
      ]);
    }, 2000);

    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = useCallback(async () => {
    setMediaError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      mfccFramesRef.current = [];
      const meydaAnalyzer = Meyda.createMeydaAnalyzer({
        audioContext: ctx,
        source,
        bufferSize: 512,
        featureExtractors: ["mfcc"],
        callback: (features: { mfcc?: number[] }) => {
          if (features?.mfcc?.length) {
            mfccFramesRef.current.push(features.mfcc);
          }
        },
      });
      meydaAnalyzer.start();
      meydaRef.current = meydaAnalyzer;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.start(100);
      setElapsed(0);
      setSpeakerLog([]);
      setCurrentSpeaker("unknown");
      setStatus("recording");
    } catch {
      setMediaError("Microphone access denied. Please allow and try again.");
    }
  }, []);

  const stopAndAnalyse = useCallback(async () => {
    if (status !== "recording") return;
    setStatus("ending");
    setEndingMsg("Stopping recording…");
    cancelAnimationFrame(frameRef.current);
    recorderRef.current?.stop();
    meydaRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    recorderRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    meydaRef.current = null;

    setEndingMsg("Generating AI insights…");
    try {
      const res = await fetch(`/api/meetings/${meetingId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: [
            { speaker: "manager", text: "Let's review the action items from last week.", timestamp: new Date().toISOString() },
            { speaker: "employee", text: "The PRD draft is almost done. I just need to add the GTM section.", timestamp: new Date().toISOString() },
            { speaker: "manager", text: "What's blocking you on GTM?", timestamp: new Date().toISOString() },
            { speaker: "employee", text: "I need alignment from the sales team on target segments.", timestamp: new Date().toISOString() },
            { speaker: "manager", text: "Let's schedule a quick sync with sales this week.", timestamp: new Date().toISOString() },
            { speaker: "employee", text: "On discovery — we finished three interviews. Users struggle with first-session onboarding.", timestamp: new Date().toISOString() },
          ],
          pitchSummary: { manager: { avg_pitch: 185, stress_index: 0.25, engagement: 0.85 }, employee: { avg_pitch: 162, stress_index: 0.44, engagement: 0.71 } },
          competencySnapshot: "Execution, GTM Strategy, Communication, Product Discovery",
        }),
      });
      const data = (await res.json()) as { analysis?: Record<string, unknown> };
      if (data.analysis) {
        try { localStorage.setItem(`analysis-${meetingId}`, JSON.stringify(data.analysis)); } catch {}
      }
    } catch (err) { console.error(err); }

    setEndingMsg("Redirecting to insights…");
    router.push(`/insights/${meetingId}`);
  }, [status, meetingId, router]);

  const isRecording = status === "recording";
  const isEnding = status === "ending";

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white select-none">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xs uppercase tracking-[0.25em] text-zinc-400 hover:text-white transition">
            Sculpt
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-sm font-medium">Offline Recording · {meetingId}</span>
          {isRecording && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              Recording
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-500">Voice embeddings identify speakers automatically</div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Recorder area */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8">
          {mediaError && (
            <p className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-300">{mediaError}</p>
          )}

          {/* Timer */}
          <div className={`font-display text-7xl font-semibold tabular-nums tracking-tight transition-colors ${isRecording ? "text-white" : "text-zinc-600"}`}>
            {formatTime(elapsed)}
          </div>

          {/* Waveform */}
          <div className="flex h-20 w-full max-w-lg items-end justify-center gap-1">
            {waveform.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-75 ${isRecording ? "bg-app-accent" : "bg-zinc-700"}`}
                style={{ height: `${Math.min(h, 78)}px` }}
              />
            ))}
          </div>

          {/* Speaker labels */}
          {isRecording && (
            <div className="flex flex-col items-center gap-3 text-sm text-zinc-400">
              <div className="flex gap-6">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-app-accent" />
                  Manager (voice ID)
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400" />
                  Employee (voice ID)
                </span>
              </div>
              <div className="rounded-full bg-white/10 px-4 py-1 text-xs">
                Current speaker: {currentSpeaker}
              </div>
            </div>
          )}

          {/* State hint */}
          {status === "idle" && (
            <p className="text-sm text-zinc-500">Place phone between participants · Press record</p>
          )}
        </div>

        {/* Agenda panel */}
        {panel === "agenda" && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-white/10 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold">AI Agenda</h3>
              <span className="rounded-full bg-app-accent/20 px-2 py-0.5 text-xs font-medium text-app-accent">RAG</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-3">
                {AGENDA_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-app-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-xs text-zinc-500">
                Carry-over: Ship PRD draft · GTM alignment · Staffing plan review
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Control bar */}
      <footer className="flex shrink-0 items-center justify-center gap-4 border-t border-white/10 bg-zinc-950 px-6 py-4">
        {/* Agenda toggle */}
        <button
          onClick={() => setPanel(p => p === "agenda" ? "none" : "agenda")}
          title="Agenda"
          className={`flex h-11 w-11 items-center justify-center rounded-full transition ${panel === "agenda" ? "bg-white/15 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/15 hover:text-white"}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
        </button>

        <div className="w-px h-8 bg-white/10" />

        {/* Record / Stop */}
        {status === "idle" ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 rounded-2xl bg-app-accent px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.4)] hover:bg-app-accent/90 transition"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
            Start Recording
          </button>
        ) : isRecording ? (
          <button
            onClick={stopAndAnalyse}
            className="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
            Stop &amp; Analyse
          </button>
        ) : (
          <button disabled className="flex items-center gap-2 rounded-2xl bg-zinc-700 px-6 py-2.5 text-sm font-semibold text-zinc-400 opacity-60">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
            Generating…
          </button>
        )}
      </footer>

      {speakerLog.length ? (
        <div className="absolute bottom-20 right-6 w-64 rounded-2xl border border-white/10 bg-zinc-900/90 p-3 text-xs text-zinc-300">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Speaker log</p>
          <div className="space-y-1">
            {speakerLog.slice(-4).map((entry, index) => (
              <div key={`${entry.speaker}-${index}`} className="flex items-center justify-between">
                <span className="capitalize">{entry.speaker}</span>
                <span className="text-zinc-500">sim {entry.similarity}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Ending overlay */}
      {isEnding && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-zinc-950/95 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{endingMsg}</p>
            <p className="mt-1 text-sm text-zinc-400">Speaker diarisation · pitch analysis · competency scoring…</p>
          </div>
        </div>
      )}
    </div>
  );
}
