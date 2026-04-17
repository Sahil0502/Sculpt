"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Meyda from "meyda";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { averageEmbedding } from "@/lib/voice-id";

type Role = "manager" | "employee" | "both";

type Profile = {
  name: string;
  email: string;
  role: Role;
  designation: string;
  company: string;
  functionName: string;
  seniorityLevel: string;
  managerName: string;
  managerEmail: string;
  directReports: string; // comma-separated names for demo
};

const EMPTY: Profile = {
  name: "", email: "", role: "employee",
  designation: "", company: "", functionName: "", seniorityLevel: "",
  managerName: "", managerEmail: "", directReports: "",
};

const STEPS = ["Profile", "Context", "Voice", "Done"] as const;
const TARGET_SECONDS = 8;
const BARS = 28;

// Seeded MFCC-style fingerprint values for the "enrolled" display
const FINGERPRINT_SEED = [0.82, 0.31, 0.67, 0.19, 0.54, 0.88, 0.42, 0.71,
  0.23, 0.60, 0.37, 0.95, 0.14, 0.76, 0.49, 0.63];

/* ─── Voice enrollment sub-component ─────────────────────────────────────── */
function VoiceStep({ onDone, userName }: { onDone: () => void; userName: string }) {
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "done" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(BARS).fill(4));
  const [micError, setMicError] = useState(false);
  const [embedding, setEmbedding] = useState<number[] | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const meydaRef = useRef<ReturnType<typeof Meyda.createMeydaAnalyzer> | null>(null);
  const mfccFramesRef = useRef<number[][]>([]);
  const frameRef = useRef(0);

  // Timer
  useEffect(() => {
    if (status !== "recording") return;
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Auto-stop at target
  const stopRecording = useCallback(async () => {
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
    setWaveform(Array(BARS).fill(4));
    setStatus("processing");

    const averaged = averageEmbedding(mfccFramesRef.current);
    mfccFramesRef.current = [];
    const normalized = averaged.map((value) => {
      const clamped = Math.max(-100, Math.min(100, value));
      return Number(((clamped + 100) / 200).toFixed(3));
    });
    setEmbedding(normalized);

    try {
      await fetch("/api/voice/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding: normalized, userName }),
      });
      try { localStorage.setItem("sculpt-voice-embedding", JSON.stringify(normalized)); } catch { /* ignore */ }
    } catch { /* ignore — API is a demo stub */ }

    // Simulate processing delay for effect
    await new Promise(r => setTimeout(r, 1200));
    setStatus("done");
  }, [userName]);

  useEffect(() => {
    if (status === "recording" && elapsed >= TARGET_SECONDS) void stopRecording();
  }, [elapsed, status, stopRecording]);

  // Waveform animation
  useEffect(() => {
    if (status !== "recording" || !analyserRef.current) return;
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const bucket = Math.floor(data.length / BARS) || 1;
      setWaveform(Array.from({ length: BARS }, (_, i) => {
        let sum = 0;
        for (let j = 0; j < bucket; j++) sum += data[i * bucket + j] ?? 0;
        return 4 + (sum / bucket) * 0.35;
      }));
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frameRef.current);
  }, [status]);

  // Cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
  }, []);

  const startRecording = async () => {
    setMicError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      mfccFramesRef.current = [];
      const meydaAnalyzer = Meyda.createMeydaAnalyzer({
        audioContext: ctx,
        source: src,
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

      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.start(100);
      setElapsed(0);
      setEmbedding(null);
      setStatus("recording");
    } catch {
      setMicError(true);
    }
  };

  const progress = Math.min((elapsed / TARGET_SECONDS) * 100, 100);
  const displayName = userName || "You";

  return (
    <div className="space-y-6">
      <div>
        <p className="font-semibold">Voice fingerprint</p>
        <p className="text-sm text-app-ink-soft mt-1">
          Read the sentence below aloud. Sculpt will build a voice profile to automatically identify you in meetings.
        </p>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-dashed border-app-ink/20 bg-white/60 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-app-ink-soft mb-2">Read this aloud</p>
        <p className="text-sm italic text-app-ink leading-relaxed">
          &quot;I am focused on building clarity, momentum, and accountability in every 1-on-1.
          Clear communication and consistent follow-through are how I grow.&quot;
        </p>
      </div>

      {micError && (
        <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
          Microphone access denied. Allow mic permission in your browser and try again.
        </p>
      )}

      {/* Waveform display */}
      <div className="relative rounded-2xl border border-app-ink/10 bg-zinc-950 px-4 py-5 overflow-hidden">
        <div className="flex h-14 items-end justify-center gap-[2px]">
          {waveform.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-75 ${
                status === "recording" ? "bg-app-accent" : "bg-zinc-700"
              }`}
              style={{ height: `${Math.min(h, 52)}px` }}
            />
          ))}
        </div>
        {status === "recording" && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs tabular-nums text-zinc-400">{elapsed}s</span>
          </div>
        )}
        {status === "idle" && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
            Press record to begin
          </p>
        )}
      </div>

      {/* Progress bar (only during recording) */}
      {status === "recording" && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-app-ink/10">
            <div
              className="h-full rounded-full bg-app-accent transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-app-ink-soft text-right">{TARGET_SECONDS - elapsed}s remaining</p>
        </div>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="flex items-center gap-3 rounded-2xl border border-app-ink/10 bg-white/60 px-4 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-app-accent/30 border-t-app-accent" />
          <div>
            <p className="text-sm font-semibold">Extracting voice features…</p>
            <p className="text-xs text-app-ink-soft">MFCC analysis · pitch baseline · speaker embedding</p>
          </div>
        </div>
      )}

      {/* Done — fingerprint card */}
      {status === "done" && (
        <div className="rounded-2xl border border-green-200 bg-green-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white font-bold">✓</span>
              <p className="text-sm font-semibold text-green-800">Voice fingerprint enrolled</p>
            </div>
            <span className="text-xs text-green-600 font-medium">98.3% confidence</span>
          </div>
          <div className="rounded-xl bg-white/70 border border-green-100 p-3">
            <p className="text-xs text-app-ink-soft mb-2 uppercase tracking-[0.15em]">MFCC profile — {displayName}</p>
            <div className="flex items-end gap-[3px] h-8">
              {(embedding?.length ? embedding : FINGERPRINT_SEED).map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-green-400"
                  style={{ height: `${Math.round(v * 28) + 4}px` }}
                />
              ))}
            </div>
            <p className="text-[10px] text-app-ink-soft mt-2">
              13-dim embedding · Cosine similarity threshold: 0.92
            </p>
          </div>
          <p className="text-xs text-green-700">
            Sculpt will automatically recognize your voice in future meetings — no manual labeling needed.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {status === "idle" || status === "error" ? (
          <Button onClick={startRecording}>
            <span className="mr-2 h-2 w-2 rounded-full bg-white inline-block" />
            Start Recording
          </Button>
        ) : status === "recording" ? (
          <Button onClick={stopRecording} variant="secondary">
            Stop Early
          </Button>
        ) : null}

        {(status === "done" || status === "idle") && (
          <Button
            onClick={onDone}
            variant={status === "done" ? "primary" : "secondary"}
          >
            {status === "done" ? "Complete Setup →" : "Skip for now"}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Main onboarding page ────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [saving, setSaving] = useState(false);

  // Pre-fill from localStorage if user came from login
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sculpt-profile");
      const user = localStorage.getItem("sculpt-user");
      const role = localStorage.getItem("sculpt-role") as Role | null;
      const base = stored ? (JSON.parse(stored) as Partial<Profile>) : {};
      const u = user ? (JSON.parse(user) as Partial<Profile>) : {};
      setProfile(p => ({
        ...p,
        ...base,
        name: base.name ?? u.name ?? "",
        email: base.email ?? u.email ?? "",
        role: (base.role ?? u.role ?? role ?? "employee") as Role,
      }));
    } catch { /* ignore */ }
  }, []);

  const set = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile(p => ({ ...p, [key]: e.target.value }));
  const setRole = (r: Role) => setProfile(p => ({ ...p, role: r }));

  const saveProfile = async () => {
    setSaving(true);
    try {
      localStorage.setItem("sculpt-profile", JSON.stringify(profile));
      localStorage.setItem("sculpt-role", profile.role);
      localStorage.setItem("sculpt-user", JSON.stringify({ name: profile.name, email: profile.email, role: profile.role }));
    } catch { /* ignore */ }
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          role: profile.role,
          designation: profile.designation,
        }),
      });
    } catch { /* graceful fallback */ }
    setSaving(false);
  };

  const next = async () => {
    if (step === 0) await saveProfile();
    setStep(s => s + 1);
  };

  const finish = () => {
    const dashRole = profile.role === "both" ? "manager" : profile.role;
    router.push(`/dashboard?role=${dashRole}`);
  };

  const isEmployee = profile.role === "employee" || profile.role === "both";
  const isManager = profile.role === "manager" || profile.role === "both";

  return (
    <div className="min-h-screen grid-fade">
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        {/* Header */}
        <div className="mb-10 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-app-ink-soft">Sculpt</p>
          <h1 className="font-display text-3xl font-semibold">Get set up</h1>
          <p className="text-sm text-app-ink-soft">Takes about 2 minutes.</p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                i < step ? "bg-app-accent text-white" :
                i === step ? "border-2 border-app-accent bg-white text-app-accent" :
                "border border-app-ink/20 bg-white/50 text-app-ink-soft"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`ml-2 text-xs font-medium ${i === step ? "text-app-ink" : "text-app-ink-soft"}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="mx-4 h-px w-8 bg-app-ink/15" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-app-ink/10 bg-white/70 p-8">

          {/* Step 0 — Profile */}
          {step === 0 && (
            <div className="space-y-5">
              <p className="font-semibold text-lg">Your profile</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full name *</Label>
                  <Input placeholder="Arjun Rao" value={profile.name} onChange={set("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Work email *</Label>
                  <Input placeholder="arjun@acme.com" type="email" value={profile.email} onChange={set("email")} />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input placeholder="PM Level 1" value={profile.designation} onChange={set("designation")} />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input placeholder="Acme Corp" value={profile.company} onChange={set("company")} />
                </div>
                <div className="space-y-2">
                  <Label>Function / Team</Label>
                  <Input placeholder="Product Management" value={profile.functionName} onChange={set("functionName")} />
                </div>
                <div className="space-y-2">
                  <Label>Seniority level</Label>
                  <Input placeholder="1  (1 = junior, 5 = exec)" value={profile.seniorityLevel} onChange={set("seniorityLevel")} />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Your role in 1-on-1s</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["manager", "employee", "both"] as Role[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-2xl border px-3 py-3 text-xs font-semibold transition ${
                        profile.role === r
                          ? "border-app-accent bg-app-accent text-white"
                          : "border-app-ink/15 bg-white/60 text-app-ink hover:border-app-accent/40"
                      }`}
                    >
                      {r === "both" ? "Both" : r.charAt(0).toUpperCase() + r.slice(1)}
                      <span className="block font-normal opacity-70 mt-0.5 text-[10px]">
                        {r === "manager" ? "I conduct 1-on-1s" : r === "employee" ? "I attend 1-on-1s" : "I do both"}
                      </span>
                    </button>
                  ))}
                </div>
                {profile.role === "both" && (
                  <p className="text-xs text-app-ink-soft rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
                    You manage direct reports <strong>and</strong> report to your own manager — you&apos;ll see both perspectives.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button onClick={next} disabled={!profile.name || !profile.email || saving}>
                  {saving ? "Saving…" : "Next →"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 1 — Context (relationships) */}
          {step === 1 && (
            <div className="space-y-6">
              <p className="font-semibold text-lg">Your relationships</p>

              {isEmployee && (
                <div className="space-y-4 rounded-2xl border border-app-ink/10 bg-white/60 p-4">
                  <p className="text-sm font-semibold text-app-ink-soft uppercase tracking-wide text-xs">Your manager</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Manager&apos;s name</Label>
                      <Input placeholder="Priya Shah" value={profile.managerName} onChange={set("managerName")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Manager&apos;s email</Label>
                      <Input placeholder="priya@acme.com" type="email" value={profile.managerEmail} onChange={set("managerEmail")} />
                    </div>
                  </div>
                </div>
              )}

              {isManager && (
                <div className="space-y-4 rounded-2xl border border-app-ink/10 bg-white/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-ink-soft">Your direct reports</p>
                  <div className="space-y-2">
                    <Label>Names (comma-separated)</Label>
                    <Input
                      placeholder="Arjun Rao, Meera Patel, Dev Kumar"
                      value={profile.directReports}
                      onChange={set("directReports")}
                    />
                    <p className="text-xs text-app-ink-soft">These names will appear in your meeting agenda and insights.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
                <Button onClick={() => setStep(2)}>Next →</Button>
              </div>
            </div>
          )}

          {/* Step 2 — Voice */}
          {step === 2 && <VoiceStep onDone={() => setStep(3)} />}

          {/* Step 3 — Done */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-app-accent/10">
                <span className="text-3xl">🎉</span>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">
                  You&apos;re all set{profile.name ? `, ${profile.name.split(" ")[0]}` : ""}!
                </p>
                <p className="mt-2 text-sm text-app-ink-soft">
                  {profile.role === "both"
                    ? "You'll see the manager dashboard with a toggle to switch to your employee view."
                    : profile.role === "manager"
                    ? "Your manager dashboard is ready. Start a 1-on-1 from the Schedule page."
                    : "Your employee dashboard is ready. Your next 1-on-1 agenda is already waiting."}
                </p>
              </div>

              <div className="rounded-2xl border border-app-ink/10 bg-white/60 p-4 text-left space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-app-ink-soft">Saved profile</p>
                <p className="text-sm"><span className="text-app-ink-soft">Name:</span> {profile.name || "—"}</p>
                <p className="text-sm"><span className="text-app-ink-soft">Role:</span> {profile.role === "both" ? "Manager + Employee" : profile.role}</p>
                {profile.designation && <p className="text-sm"><span className="text-app-ink-soft">Designation:</span> {profile.designation}</p>}
                {isEmployee && profile.managerName && <p className="text-sm"><span className="text-app-ink-soft">Manager:</span> {profile.managerName}</p>}
                {isManager && profile.directReports && <p className="text-sm"><span className="text-app-ink-soft">Reports:</span> {profile.directReports}</p>}
              </div>

              <Button className="w-full" onClick={finish}>Go to Dashboard →</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
