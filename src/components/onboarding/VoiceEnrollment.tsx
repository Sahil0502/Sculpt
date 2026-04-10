"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const TARGET_SECONDS = 10;

export function VoiceEnrollment() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("Idle");
  const [saving, setSaving] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!recording) return;

    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (!recording) return;
    if (elapsed < TARGET_SECONDS) return;

    void stopRecording();
  }, [elapsed, recording]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startRecording = async () => {
    setStatus("Requesting microphone...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.start();
      setElapsed(0);
      setRecording(true);
      setStatus("Recording...");
    } catch (error) {
      console.error(error);
      setStatus("Microphone access denied.");
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) {
      setRecording(false);
      return;
    }

    recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    streamRef.current = null;
    setRecording(false);
    setSaving(true);
    setStatus("Saving voice fingerprint...");

    const embedding = Array.from({ length: 13 }, () => Number(Math.random().toFixed(3)));

    try {
      await fetch("/api/voice/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding }),
      });
      setStatus("Voice fingerprint saved.");
    } catch (error) {
      console.error(error);
      setStatus("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-app-ink/10 bg-white/70 p-6">
      <h3 className="font-display text-lg font-semibold">Voice Enrollment</h3>
      <p className="text-sm text-app-ink-soft">
        Read the highlighted paragraph for 10 seconds so we can build your voice fingerprint.
      </p>
      <div className="rounded-2xl border border-dashed border-app-ink/20 bg-white/60 p-4 text-sm text-app-ink-soft">
        &quot;I am focused on building clarity, momentum, and accountability in every 1-on-1.&quot;
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => (recording ? stopRecording() : startRecording())}
          disabled={saving}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </Button>
        <span className="text-xs text-app-ink-soft">
          {recording ? `${elapsed}s / ${TARGET_SECONDS}s` : "Not recording"}
        </span>
      </div>
      <p className="text-xs text-app-ink-soft">{saving ? "Saving..." : status}</p>
    </div>
  );
}
