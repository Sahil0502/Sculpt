export type SpeechChunk = {
  text: string;
  isFinal: boolean;
};

export type SpeechRecognitionResult = {
  isFinal: boolean;
  0?: { transcript?: string };
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResult[];
};

export type SpeechRecognizer = {
  continuous: boolean;
  interimResults: boolean;
  onresult?: (event: SpeechRecognitionEventLike) => void;
  onerror?: () => void;
  onend?: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognizer;

export function createSpeechRecognizer(): SpeechRecognizer | null {
  if (typeof window === "undefined") {
    return null;
  }

  const host = window as Window &
    typeof globalThis & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };

  const SpeechRecognition = host.SpeechRecognition || host.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognizer = new SpeechRecognition();
  recognizer.continuous = true;
  recognizer.interimResults = true;

  return recognizer;
}
