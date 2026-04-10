"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  type SpeechRecognitionEventLike,
  type SpeechRecognizer,
  createSpeechRecognizer,
} from "@/lib/speech";

type TranscriptEntry = {
  id: string;
  speaker: "you" | "peer";
  text: string;
  timestamp: string;
};

export function TranscriptPanel({
  entries,
  onLocalTranscript,
  autoStart = false,
}: {
  entries: TranscriptEntry[];
  onLocalTranscript: (text: string) => void;
  autoStart?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest line
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, interim]);

  useEffect(() => {
    const recognizer = createSpeechRecognizer();
    recognizerRef.current = recognizer;

    if (!recognizer) {
      setError("Speech recognition not supported. Use Chrome for best results.");
      return;
    }

    recognizer.onresult = (event: SpeechRecognitionEventLike) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalText += result[0]?.transcript ?? "";
        } else {
          interimText += result[0]?.transcript ?? "";
        }
      }

      setInterim(interimText);

      if (finalText.trim()) {
        onLocalTranscript(finalText.trim());
        setInterim("");
      }
    };

    recognizer.onerror = () => {
      setError("Speech recognition error. Check microphone permissions.");
      setListening(false);
    };

    recognizer.onend = () => {
      setListening(false);
      setInterim("");
    };
  // onLocalTranscript is stable (useCallback) so this is fine
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start when session goes live
  useEffect(() => {
    if (!autoStart) return;
    const recognizer = recognizerRef.current;
    if (!recognizer || listening) return;
    try {
      recognizer.start();
      setListening(true);
      setError("");
    } catch {
      // already started — ignore
    }
  }, [autoStart, listening]);

  const toggleListening = () => {
    const recognizer = recognizerRef.current;
    if (!recognizer) {
      setError("Speech recognition not supported. Use Chrome.");
      return;
    }
    setError("");

    if (listening) {
      recognizer.stop();
      setListening(false);
      setInterim("");
      return;
    }

    try {
      recognizer.start();
      setListening(true);
    } catch {
      setError("Could not start speech recognition.");
    }
  };

  return (
    <div className="rounded-3xl border border-app-ink/10 bg-white/70 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold">Live Transcript</h3>
          {listening && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              Listening
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={listening ? "primary" : "secondary"}
          onClick={toggleListening}
        >
          {listening ? "Pause" : "Start"}
        </Button>
      </div>

      <div className="mt-3 max-h-64 space-y-2 overflow-auto rounded-2xl border border-app-ink/10 bg-white/60 p-3 text-sm">
        {entries.length === 0 && !interim ? (
          <p className="text-app-ink-soft">
            {listening
              ? "Listening… speak now."
              : "Press Start to begin capturing transcript."}
          </p>
        ) : (
          entries.map((entry) => (
            <p key={entry.id}>
              <span className="font-semibold text-app-accent">
                {entry.speaker === "you" ? "You" : "Colleague"}:
              </span>{" "}
              {entry.text}
            </p>
          ))
        )}
        {interim ? <p className="italic text-app-ink-soft">{interim}</p> : null}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
