"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Peer, { type DataConnection, type MediaConnection } from "peerjs";
import { useCallback, useEffect, useRef, useState } from "react";

import { AgendaPanel } from "@/components/meeting/AgendaPanel";
import { MeetingControls } from "@/components/meeting/MeetingControls";
import { PitchAnalyzer } from "@/components/meeting/PitchAnalyzer";
import { TranscriptPanel } from "@/components/meeting/TranscriptPanel";
import { VideoCall } from "@/components/meeting/VideoCall";
import { Button } from "@/components/ui/button";

const peerHost = process.env.NEXT_PUBLIC_PEERJS_HOST || "0.peerjs.com";
const peerPort = Number(process.env.NEXT_PUBLIC_PEERJS_PORT || "443");
const peerSecure = (process.env.NEXT_PUBLIC_PEERJS_SECURE || "true") === "true";

type TranscriptEntry = {
  id: string;
  speaker: "you" | "peer";
  text: string;
  timestamp: string;
};

export function MeetingRoomClient({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const callRef = useRef<MediaConnection | null>(null);

  const [peerId, setPeerId] = useState("");
  const [status, setStatus] = useState("Not started");
  const [mediaError, setMediaError] = useState("");
  const [starting, setStarting] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcriptStarted, setTranscriptStarted] = useState(false);

  const attachConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn;
    conn.on("data", (data) => {
      if (typeof data !== "object" || data === null) return;
      const payload = data as { type?: string; text?: string };
      if (payload.type === "transcript") {
        const text = payload.text?.trim();
        if (!text) return;
        setEntries((prev) => [
          ...prev,
          { id: `${Date.now()}-peer`, speaker: "peer", text, timestamp: new Date().toISOString() },
        ]);
      }
    });
    conn.on("close", () => {
      if (connRef.current === conn) connRef.current = null;
    });
  }, []);

  const attachCall = useCallback((call: MediaConnection) => {
    callRef.current = call;
    setStatus("In call");
    call.on("stream", (stream) => setRemoteStream(stream));
    call.on("close", () => {
      if (callRef.current === call) callRef.current = null;
      setRemoteStream(null);
    });
  }, []);

  const startSession = useCallback(async () => {
    if (starting || peerRef.current) return;
    setStarting(true);
    setMediaError("");
    setStatus("Requesting camera & mic…");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      setMediaError("Camera or microphone access was denied. Please allow access and try again.");
      setStatus("Permission denied");
      setStarting(false);
      return;
    }

    setLocalStream(stream);
    setStatus("Session live (solo)");
    setStarting(false);

    // Auto-start transcript
    setTranscriptStarted(true);

    // Attempt PeerJS in the background — failure is non-blocking
    try {
      const peer = new Peer({ host: peerHost, port: peerPort, secure: peerSecure });
      peerRef.current = peer;

      peer.on("open", (id) => {
        setPeerId(id);
        setStatus("Session live");
      });

      peer.on("call", (call) => {
        call.answer(stream);
        attachCall(call);
      });

      peer.on("connection", (conn) => {
        attachConnection(conn);
      });

      // Silently swallow PeerJS errors — solo mode still works
      peer.on("error", (err) => {
        console.warn("[PeerJS]", err.type, err.message);
        if (!peerRef.current?.open) {
          setPeerId("");
          setStatus("Session live (solo)");
        }
      });
    } catch (err) {
      console.warn("[PeerJS] init failed", err);
    }
  }, [attachCall, attachConnection, starting]);

  const connectToPeer = useCallback(
    (remoteId: string) => {
      if (!peerRef.current || !localStream || !remoteId) return;
      setStatus("Calling colleague…");
      const call = peerRef.current.call(remoteId, localStream);
      attachCall(call);
      const conn = peerRef.current.connect(remoteId);
      attachConnection(conn);
    },
    [attachCall, attachConnection, localStream]
  );

  const endSession = useCallback(() => {
    connRef.current?.close();
    callRef.current?.close();
    peerRef.current?.disconnect();
    peerRef.current?.destroy();
    localStream?.getTracks().forEach((t) => t.stop());

    connRef.current = null;
    callRef.current = null;
    peerRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setPeerId("");
    setEntries([]);
    setStatus("Ended");
    setMediaError("");
    setStarting(false);
    setTranscriptStarted(false);

    router.push(`/insights/${meetingId}`);
  }, [localStream, meetingId, router]);

  const handleLocalTranscript = useCallback(
    (text: string) => {
      setEntries((prev) => [
        ...prev,
        { id: `${Date.now()}-you`, speaker: "you", text, timestamp: new Date().toISOString() },
      ]);
      connRef.current?.send({ type: "transcript", text });
    },
    []
  );

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStream?.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    setCameraOn((prev) => {
      const next = !prev;
      localStream?.getVideoTracks().forEach((t) => (t.enabled = next));
      return next;
    });
  }, [localStream]);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      const transcript =
        entries.length > 0
          ? entries.map((e) => ({
              speaker: e.speaker,
              text: e.text,
              timestamp: e.timestamp,
            }))
          : [
              { speaker: "you", text: "Let's go through the action items from last week.", timestamp: new Date().toISOString() },
              { speaker: "peer", text: "The PRD draft is almost done. I just need the GTM section.", timestamp: new Date().toISOString() },
              { speaker: "you", text: "What's blocking you on GTM?", timestamp: new Date().toISOString() },
              { speaker: "peer", text: "I need alignment from the sales team on target segments.", timestamp: new Date().toISOString() },
            ];

      const response = await fetch(`/api/meetings/${meetingId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          pitchSummary: {},
          competencySnapshot: "Execution, Communication, GTM Strategy, Leadership",
        }),
      });

      const data = (await response.json()) as { analysis?: Record<string, unknown> };
      const result = data.analysis ?? { message: "No analysis returned." };
      setAnalysis(result);

      try {
        localStorage.setItem(`analysis-${meetingId}`, JSON.stringify(result));
      } catch {
        // ignore
      }
    } catch (err) {
      console.error(err);
      setAnalysis({ message: "Analysis failed. Check console." });
    } finally {
      setAnalyzing(false);
    }
  }, [entries, meetingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
      localStream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      {/* Left column */}
      <div className="space-y-4">
        <VideoCall
          meetingId={meetingId}
          localStream={localStream}
          remoteStream={remoteStream}
          peerId={peerId}
          status={status}
          onStart={startSession}
          onConnect={connectToPeer}
          starting={starting}
        />

        <MeetingControls
          muted={muted}
          cameraOn={cameraOn}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onEnd={endSession}
        />

        {mediaError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mediaError}
          </div>
        ) : null}

        <TranscriptPanel
          entries={entries}
          onLocalTranscript={handleLocalTranscript}
          autoStart={transcriptStarted}
        />
      </div>

      {/* Right column */}
      <div className="space-y-4">
        <AgendaPanel meetingId={meetingId} />
        <PitchAnalyzer stream={localStream} />

        {/* AI Insights panel */}
        <div className="rounded-3xl border border-app-ink/10 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">AI Insights</h3>
            <Button size="sm" variant="secondary" onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? "Analysing…" : "Generate"}
            </Button>
          </div>

          {analysis ? (
            <div className="mt-3 space-y-3">
              {"summary" in analysis && typeof analysis.summary === "string" ? (
                <p className="text-sm text-app-ink-soft">{analysis.summary}</p>
              ) : (
                <pre className="whitespace-pre-wrap text-xs text-app-ink">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              )}
              <Link href={`/insights/${meetingId}`}>
                <Button size="sm" className="w-full">
                  View Full Insights →
                </Button>
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-app-ink-soft">
              {entries.length > 0
                ? `${entries.length} transcript lines ready. Click Generate to analyse.`
                : "Start the session, speak, then generate AI insights."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
