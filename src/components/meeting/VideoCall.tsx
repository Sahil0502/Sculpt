"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VideoCall({
  meetingId,
  localStream,
  remoteStream,
  peerId,
  status,
  onStart,
  onConnect,
  starting,
}: {
  meetingId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerId: string;
  status: string;
  onStart: () => void;
  onConnect: (remoteId: string) => void;
  starting: boolean;
}) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream ?? null;
    }
  }, [remoteStream]);

  const copyPeerId = () => {
    if (!peerId) return;
    navigator.clipboard.writeText(peerId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isLive = Boolean(localStream);

  return (
    <div className="overflow-hidden rounded-3xl border border-app-ink/10 bg-white/70">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-app-ink/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">Meeting {meetingId}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isLive
                ? "bg-green-100 text-green-700"
                : "bg-app-ink/5 text-app-ink-soft"
            }`}
          >
            {isLive ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                Live
              </>
            ) : (
              status
            )}
          </span>
        </div>

        {!isLive && (
          <Button size="sm" onClick={onStart} disabled={starting}>
            {starting ? "Starting…" : "Start Session"}
          </Button>
        )}

        {isLive && peerId && (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-app-ink-soft md:block">
              Session ID:{" "}
              <span className="font-mono">{peerId.slice(0, 8)}…</span>
            </span>
            <Button size="sm" variant="secondary" onClick={copyPeerId}>
              {copied ? "Copied!" : "Copy ID"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInvite((p) => !p)}
            >
              {showInvite ? "Close" : "Invite Colleague"}
            </Button>
          </div>
        )}
      </div>

      {/* Invite panel */}
      {showInvite && (
        <div className="flex items-center gap-3 border-b border-app-ink/10 bg-amber-50/60 px-5 py-3">
          <p className="text-xs text-app-ink-soft">
            Share your Session ID above, then paste their ID here:
          </p>
          <Input
            className="max-w-xs"
            placeholder="Colleague's Session ID"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              onConnect(inviteInput.trim());
              setShowInvite(false);
              setInviteInput("");
            }}
            disabled={!inviteInput.trim() || inviteInput.trim() === peerId}
          >
            Connect
          </Button>
        </div>
      )}

      {/* Videos */}
      <div className="grid gap-0 md:grid-cols-2">
        {/* Local */}
        <div className="relative bg-zinc-900">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-56 flex-col items-center justify-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700">
                <svg className="h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-400">Camera off</p>
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
            You
          </span>
        </div>

        {/* Remote */}
        <div className="relative border-l border-app-ink/10 bg-zinc-900">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-56 flex-col items-center justify-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700">
                <svg className="h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-400">
                {isLive ? "Waiting for colleague…" : "Not started"}
              </p>
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
            Colleague
          </span>
        </div>
      </div>
    </div>
  );
}
