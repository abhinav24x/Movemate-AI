"use client";

import { useRef, useState, useCallback } from "react";

export type RecordingState = "idle" | "requesting" | "recording" | "processing" | "error";

export interface UseVoiceRecorderOptions {
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}

export function useVoiceRecorder({ onTranscript, onError }: UseVoiceRecorderOptions) {
  const [state, setState] = useState<RecordingState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (state === "recording") return;

    setState("requesting");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick the best supported MIME type
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });

        if (audioBlob.size === 0) {
          setState("error");
          onError("No audio recorded — please try again.");
          return;
        }

        setState("processing");
        try {
          await transcribeBlob(audioBlob, mimeType, onTranscript);
          setState("idle");
        } catch (err: unknown) {
          setState("error");
          onError(err instanceof Error ? err.message : "Transcription failed");
        }
      };

      recorder.onerror = () => {
        setState("error");
        onError("Recording error occurred");
      };

      recorder.start(250); // Collect data every 250ms
      setState("recording");
    } catch (err: unknown) {
      setState("error");
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          onError("Microphone access was denied. Please allow microphone permission and try again.");
        } else if (err.name === "NotFoundError") {
          onError("No microphone found. Please connect a microphone and try again.");
        } else {
          onError(`Microphone error: ${err.message}`);
        }
      } else {
        onError("Failed to start recording");
      }
    }
  }, [state, onTranscript, onError]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggle = useCallback(() => {
    if (state === "recording") {
      stop();
    } else if (state === "idle" || state === "error") {
      start();
    }
  }, [state, start, stop]);

  const resetError = useCallback(() => {
    if (state === "error") setState("idle");
  }, [state]);

  return { state, toggle, start, stop, resetError };
}

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

async function transcribeBlob(
  blob: Blob,
  mimeType: string,
  onTranscript: (text: string) => void,
): Promise<void> {
  const formData = new FormData();
  formData.append("audio", blob, "recording.webm");

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? `Transcription failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.transcript) {
    throw new Error("No speech detected — please try again.");
  }

  onTranscript(data.transcript);
}
