"use client";

import { useState, useCallback, useRef } from "react";
import type { ConversationState, AgentResponse } from "@/lib/schemas/agent-response";
import { createInitialState } from "@/lib/conversation/agent";

export type ConversationPhase =
  | "idle"
  | "processing"
  | "speaking"
  | "error";

export interface UseConversationReturn {
  state: ConversationState;
  phase: ConversationPhase;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  reset: () => void;
}

export function useConversation(): UseConversationReturn {
  const [state, setState] = useState<ConversationState>(createInitialState);
  const [phase, setPhase] = useState<ConversationPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    setError(null);
    setPhase("processing");

    try {
      // 1. Call the agent API
      const agentRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText.trim(),
          conversationState: state,
        }),
      });

      if (!agentRes.ok) {
        const data = await agentRes.json().catch(() => ({}));
        throw new Error(data.error ?? `Agent error (${agentRes.status})`);
      }

      const agentData: AgentResponse = await agentRes.json();

      // 2. Update conversation state immediately so UI reflects new state
      setState(agentData.updatedState);

      // 3. Synthesize and play TTS
      setPhase("speaking");
      await playTTS(agentData.assistantMessage, audioRef);

      setPhase("idle");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setPhase("error");
    }
  }, [state]);

  const reset = useCallback(() => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState(createInitialState());
    setPhase("idle");
    setError(null);
  }, []);

  return { state, phase, error, sendMessage, reset };
}

async function playTTS(
  text: string,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
): Promise<void> {
  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      // TTS failure is non-fatal — just skip audio
      console.warn("TTS failed, skipping audio playback");
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    await new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(); // Non-fatal
      };
      audio.play().catch(() => resolve()); // Non-fatal if autoplay is blocked
    });
  } catch {
    // TTS failure should never crash the conversation
    console.warn("TTS playback error, continuing without audio");
  }
}
