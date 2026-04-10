"use client";

import { Button } from "@/components/ui/button";

export function MeetingControls({
  muted,
  cameraOn,
  onToggleMute,
  onToggleCamera,
  onEnd,
}: {
  muted: boolean;
  cameraOn: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-app-ink/10 bg-white/70 p-4">
      <Button size="sm" variant={muted ? "secondary" : "ghost"} onClick={onToggleMute}>
        {muted ? "Unmute" : "Mute"}
      </Button>
      <Button size="sm" variant={cameraOn ? "ghost" : "secondary"} onClick={onToggleCamera}>
        {cameraOn ? "Camera On" : "Camera Off"}
      </Button>
      <Button size="sm" variant="primary" onClick={onEnd}>
        End Session
      </Button>
    </div>
  );
}
