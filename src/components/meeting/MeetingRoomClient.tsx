"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Peer, { type DataConnection, type MediaConnection } from "peerjs";
import { useCallback, useEffect, useRef, useState } from "react";

import { createSpeechRecognizer, type SpeechRecognitionEventLike, type SpeechRecognizer } from "@/lib/speech";

const peerHost = process.env.NEXT_PUBLIC_PEERJS_HOST || "0.peerjs.com";
const peerPort = Number(process.env.NEXT_PUBLIC_PEERJS_PORT || "443");
const peerSecure = (process.env.NEXT_PUBLIC_PEERJS_SECURE || "true") === "true";

const COLLEAGUE_SCRIPT = [
  "Thanks for making time. Should we start with the action items from last week?",
  "The PRD draft is almost done — I just need to add the GTM section.",
  "I'm blocked on GTM because I need alignment from the sales team on target segments.",
  "I think we can close it by Friday if we get that alignment today.",
  "On the discovery side, we finished three customer interviews. The patterns are pretty clear.",
  "Users are struggling with onboarding — specifically the first session setup.",
  "I'd like to propose a discovery sprint focused on that in Q2.",
  "For the roadmap risks, the main one is the API dependency on the data team.",
  "If they slip, our launch moves by at least two weeks.",
  "Should we escalate that to the leadership sync?",
];

const AGENDA_ITEMS = [
  "Review action items from Apr 3 — PRD draft status, staffing plan",
  "GTM strategy alignment (flagged as blind spot in last 2 meetings)",
  "Discovery sprint proposal for Q2 onboarding",
  "API dependency risk — escalation decision",
  "Career growth: competency gaps and next milestone",
];

type Entry = { id: string; speaker: "you" | "peer"; text: string };

type Panel = "none" | "transcript" | "agenda";

export function MeetingRoomClient({ meetingId }: { meetingId: string }) {
  const router = useRouter();

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simLineRef = useRef(0);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);

  // State
  const [status, setStatus] = useState<"idle" | "starting" | "live" | "ending">("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerId, setPeerId] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [panel, setPanel] = useState<Panel>("none");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [colleagueActive, setColleagueActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [endingMsg, setEndingMsg] = useState("");

  // Sync video elements with streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (status === "live" && panel === "none") {
      setPanel("agenda");
    }
  }, [status, panel]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream ?? null;
    }
  }, [remoteStream]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, interim]);

  // Speech recognizer setup
  useEffect(() => {
    const rec = createSpeechRecognizer();
    recognizerRef.current = rec;
    if (!rec) return;

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      let final = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0]?.transcript ?? "";
        else interimText += r[0]?.transcript ?? "";
      }
      setInterim(interimText);
      if (final.trim()) {
        setEntries(p => [...p, { id: `${Date.now()}-you`, speaker: "you", text: final.trim() }]);
        setInterim("");
        try { connRef.current?.send({ type: "transcript", text: final.trim() }); } catch {}
      }
    };
    rec.onerror = () => { setListening(false); setInterim(""); };
    rec.onend = () => { setListening(false); setInterim(""); };
  }, []);

  const addPeerEntry = useCallback((text: string) => {
    setEntries(p => [...p, { id: `${Date.now()}-peer`, speaker: "peer", text }]);
  }, []);

  // PeerJS helpers
  const attachCall = useCallback((call: MediaConnection) => {
    callRef.current = call;
    call.on("stream", s => setRemoteStream(s));
    call.on("close", () => { if (callRef.current === call) { callRef.current = null; setRemoteStream(null); } });
  }, []);

  const attachConn = useCallback((conn: DataConnection) => {
    connRef.current = conn;
    conn.on("data", d => {
      if (typeof d === "object" && d !== null) {
        const p = d as { type?: string; text?: string };
        if (p.type === "transcript" && p.text?.trim()) addPeerEntry(p.text.trim());
      }
    });
    conn.on("close", () => { if (connRef.current === conn) connRef.current = null; });
  }, [addPeerEntry]);

  // Start session
  const startSession = useCallback(async () => {
    if (status !== "idle") return;
    setStatus("starting");
    setMediaError("");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      setMediaError("Camera / microphone access denied. Please allow and refresh.");
      setStatus("idle");
      return;
    }

    setLocalStream(stream);
    setStatus("live");

    // Auto-start transcript
    if (recognizerRef.current) {
      try { recognizerRef.current.start(); setListening(true); } catch {}
    }

    // PeerJS — silent background
    try {
      const peer = new Peer({ host: peerHost, port: peerPort, secure: peerSecure });
      peerRef.current = peer;
      peer.on("open", id => setPeerId(id));
      peer.on("call", call => { call.answer(stream); attachCall(call); });
      peer.on("connection", conn => attachConn(conn));
      peer.on("error", err => { console.warn("[PeerJS]", err.type); });
    } catch (err) { console.warn("[PeerJS] init", err); }
  }, [status, attachCall, attachConn]);

  // Connect to real peer
  const connectToPeer = useCallback((remoteId: string) => {
    if (!peerRef.current || !localStream || !remoteId) return;
    const call = peerRef.current.call(remoteId, localStream);
    attachCall(call);
    attachConn(peerRef.current.connect(remoteId));
  }, [localStream, attachCall, attachConn]);

  // Simulate colleague
  const simulateColleague = useCallback(() => {
    setColleagueActive(true);
    simLineRef.current = 0;
    const schedule = () => {
      const delay = 4000 + Math.random() * 3000;
      simTimerRef.current = setTimeout(() => {
        const line = COLLEAGUE_SCRIPT[simLineRef.current];
        if (line) { addPeerEntry(line); simLineRef.current++; if (simLineRef.current < COLLEAGUE_SCRIPT.length) schedule(); }
      }, delay);
    };
    simTimerRef.current = setTimeout(() => { addPeerEntry(COLLEAGUE_SCRIPT[0]!); simLineRef.current = 1; schedule(); }, 1200);
  }, [addPeerEntry]);

  // Toggle mute / camera
  const toggleMute = useCallback(() => {
    setMuted(p => { const next = !p; localStream?.getAudioTracks().forEach(t => t.enabled = !next); return next; });
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    setCameraOn(p => { const next = !p; localStream?.getVideoTracks().forEach(t => t.enabled = next); return next; });
  }, [localStream]);

  // Toggle transcript listening manually
  const toggleListening = useCallback(() => {
    const rec = recognizerRef.current;
    if (!rec) return;
    if (listening) { rec.stop(); setListening(false); }
    else { try { rec.start(); setListening(true); } catch {} }
  }, [listening]);

  // Copy peer ID
  const copyId = () => {
    if (!peerId) return;
    navigator.clipboard.writeText(peerId).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // End session — auto generate insights then redirect
  const endSession = useCallback(async () => {
    if (status === "ending") return;
    setStatus("ending");
    setEndingMsg("Stopping session…");

    // Stop everything
    if (simTimerRef.current) clearTimeout(simTimerRef.current);
    try { recognizerRef.current?.stop(); } catch {}
    connRef.current?.close();
    callRef.current?.close();
    peerRef.current?.destroy();
    localStream?.getTracks().forEach(t => t.stop());

    setEndingMsg("Generating AI insights…");

    // Build transcript for analysis
    const transcript = entries.length > 0
      ? entries.map(e => ({ speaker: e.speaker, text: e.text, timestamp: new Date().toISOString() }))
      : COLLEAGUE_SCRIPT.slice(0, 6).map((text, i) => ({ speaker: i % 2 === 0 ? "peer" : "you", text, timestamp: new Date().toISOString() }));

    try {
      const res = await fetch(`/api/meetings/${meetingId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          pitchSummary: { manager: { avg_pitch: 185, stress_index: 0.28, engagement: 0.82 }, employee: { avg_pitch: 162, stress_index: 0.44, engagement: 0.71 } },
          competencySnapshot: "Execution, Communication, GTM Strategy, Leadership, Product Discovery",
        }),
      });
      const data = (await res.json()) as { analysis?: Record<string, unknown> };
      if (data.analysis) {
        try { localStorage.setItem(`analysis-${meetingId}`, JSON.stringify(data.analysis)); } catch {}
      }
    } catch (err) { console.error(err); }

    setEndingMsg("Redirecting to insights…");
    router.push(`/insights/${meetingId}`);
  }, [status, localStream, entries, meetingId, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
      peerRef.current?.destroy();
    };
  }, []);

  const isLive = status === "live";
  const isEnding = status === "ending";
  const hasRemote = Boolean(remoteStream) || colleagueActive;

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white select-none">

      {/* ── Top bar ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xs uppercase tracking-[0.25em] text-zinc-400 hover:text-white transition">
            Sculpt
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-sm font-medium">Meeting {meetingId}</span>
          {isLive && (
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              Live
            </span>
          )}
        </div>

        {/* Peer invite row */}
        {isLive && peerId && (
          <div className="flex items-center gap-2">
            {showInvite && (
              <div className="flex items-center gap-2">
                <input
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/30 w-52"
                  placeholder="Colleague's session ID"
                  value={inviteInput}
                  onChange={e => setInviteInput(e.target.value)}
                />
                <button
                  onClick={() => { connectToPeer(inviteInput.trim()); setShowInvite(false); setInviteInput(""); }}
                  disabled={!inviteInput.trim() || inviteInput.trim() === peerId}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 disabled:opacity-40 transition"
                >
                  Connect
                </button>
              </div>
            )}
            <button onClick={copyId} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20 transition">
              {copied ? "Copied!" : "Copy ID"}
            </button>
            <button onClick={() => setShowInvite(p => !p)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20 transition">
              {showInvite ? "Cancel" : "Invite"}
            </button>
          </div>
        )}
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video area */}
        <div className="relative flex-1 bg-zinc-900">

          {/* Idle / not started */}
          {status === "idle" && (
            <div className="flex h-full flex-col items-center justify-center gap-6">
              {mediaError && (
                <p className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-300">{mediaError}</p>
              )}
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
                <svg className="h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <button
                onClick={startSession}
                className="rounded-2xl bg-app-accent px-8 py-3 font-semibold shadow-[0_18px_40px_rgba(249,115,22,0.35)] hover:-translate-y-0.5 transition text-white"
              >
                Start Session
              </button>
              <p className="text-sm text-zinc-500">Camera &amp; microphone required</p>
            </div>
          )}

          {status === "starting" && (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-zinc-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="text-sm">Requesting camera…</p>
              </div>
            </div>
          )}

          {/* Live video */}
          {(isLive || isEnding) && (
            <>
              {/* Main video — colleague when connected, self otherwise */}
              <div className="h-full w-full">
                {hasRemote ? (
                  <>
                    {/* Remote / simulated colleague fills main */}
                    {remoteStream ? (
                      <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                    ) : (
                      /* Simulated colleague avatar */
                      <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-800">
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-app-accent/20 ring-4 ring-app-accent/40">
                          <svg className="h-14 w-14 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-zinc-800 bg-green-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">Arjun Rao</p>
                          <p className="text-sm text-zinc-400">Audio · Connected</p>
                        </div>
                      </div>
                    )}

                    {/* Self pip — bottom right */}
                    <div className="absolute bottom-4 right-4 overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl">
                      {cameraOn ? (
                        <video ref={localVideoRef} autoPlay muted playsInline className="h-28 w-44 object-cover" />
                      ) : (
                        <div className="flex h-28 w-44 items-center justify-center bg-zinc-900">
                          <svg className="h-8 w-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">You</span>
                    </div>
                  </>
                ) : (
                  /* Solo — self fills main */
                  <>
                    {cameraOn ? (
                      <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-900">
                        <svg className="h-16 w-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        <p className="text-sm text-zinc-500">Camera off</p>
                      </div>
                    )}
                    <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">You</span>

                    {/* Placeholder for colleague */}
                    <div className="absolute bottom-4 right-4 flex h-28 w-44 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-white/10 bg-zinc-800">
                      <svg className="h-8 w-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                      <p className="text-xs text-zinc-500">Colleague</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Side panel (transcript or agenda) */}
        {panel !== "none" && isLive && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-white/10 bg-zinc-900">
            {panel === "transcript" ? (
              <>
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Transcript</h3>
                    {listening && (
                      <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                        Listening
                      </span>
                    )}
                  </div>
                  <button
                    onClick={toggleListening}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition ${listening ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/10 text-zinc-300 hover:bg-white/20"}`}
                  >
                    {listening ? "Pause" : "Resume"}
                  </button>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                  {entries.length === 0 && !interim ? (
                    <p className="text-zinc-500">{listening ? "Listening… speak now." : "Transcript auto-starts with session."}</p>
                  ) : (
                    entries.map(e => (
                      <p key={e.id}>
                        <span className={`font-semibold ${e.speaker === "you" ? "text-app-accent" : "text-teal-400"}`}>
                          {e.speaker === "you" ? "You" : "Arjun"}:
                        </span>{" "}
                        <span className="text-zinc-300">{e.text}</span>
                      </p>
                    ))
                  )}
                  {interim && <p className="italic text-zinc-500">{interim}</p>}
                  <div ref={transcriptBottomRef} />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </aside>
        )}
      </div>

      {/* ── Control bar ── */}
      {(isLive || isEnding) && (
        <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-zinc-950 px-6 py-4">
          {/* Mic */}
          <ControlBtn
            active={!muted}
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
            icon={muted ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 19 5 5m10.5 10.5A4.501 4.501 0 0 1 7.5 12v-1.5m9 0V12a4.5 4.5 0 0 0-1.035-2.872M12 18.75v2.25m-3.75 0h7.5M12 3a4.5 4.5 0 0 1 4.5 4.5v4.5" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
            )}
          />

          {/* Camera */}
          <ControlBtn
            active={cameraOn}
            onClick={toggleCamera}
            title={cameraOn ? "Camera on" : "Camera off"}
            icon={cameraOn ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5 20.47 5.78a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" /></svg>
            )}
          />

          {/* Transcript toggle */}
          <ControlBtn
            active={panel === "transcript"}
            onClick={() => setPanel(p => p === "transcript" ? "none" : "transcript")}
            title="Transcript"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
            }
          />

          {/* Agenda toggle */}
          <ControlBtn
            active={panel === "agenda"}
            onClick={() => setPanel(p => p === "agenda" ? "none" : "agenda")}
            title="Agenda"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
            }
          />

          {/* Simulate colleague */}
          {!colleagueActive && (
            <ControlBtn
              active={false}
              onClick={simulateColleague}
              title="Add demo colleague"
              muted
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
              }
            />
          )}

          {/* Spacer */}
          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* End session */}
          <button
            onClick={endSession}
            disabled={isEnding}
            className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-red-600 disabled:opacity-60 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" /></svg>
            {isEnding ? "Ending…" : "End Session"}
          </button>
        </footer>
      )}

      {/* ── Ending overlay ── */}
      {isEnding && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-zinc-950/95 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{endingMsg}</p>
            <p className="mt-1 text-sm text-zinc-400">Analysing transcript and pitch signals…</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlBtn({
  active,
  muted: dimmed,
  onClick,
  title,
  icon,
}: {
  active: boolean;
  muted?: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
        active
          ? "bg-white/15 text-white hover:bg-white/25"
          : dimmed
          ? "bg-white/5 text-zinc-600 hover:bg-white/10 hover:text-zinc-400"
          : "bg-white/5 text-zinc-400 hover:bg-white/15 hover:text-white"
      }`}
    >
      {icon}
    </button>
  );
}
