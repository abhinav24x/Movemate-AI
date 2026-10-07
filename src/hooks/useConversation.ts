"use client";

import { useState, useCallback, useRef } from "react";
import type { ConversationState, AgentResponse } from "@/lib/schemas/agent-response";
import { createInitialState } from "@/lib/conversation/agent";

export type ConversationPhase =
  | "idle"
  | "processing"
  | "preparing"
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
  const audioUrlRef = useRef<string | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const turnIdRef = useRef(0);

  const cancelCurrentTurn = useCallback(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    const turnId = ++turnIdRef.current;
    cancelCurrentTurn();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const turnStartedAt = performance.now();

    setError(null);
    setPhase("processing");

    try {
      const agentRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
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
      if (turnId !== turnIdRef.current) return;
      logDevTiming("AI response received", turnStartedAt);

      // Render the text immediately while the separate voice request runs.
      setState(agentData.updatedState);
      setPhase("preparing");

      await playTTS(
        agentData.assistantMessage,
        audioRef,
        audioUrlRef,
        controller.signal,
        () => {
          if (turnId === turnIdRef.current) {
            logDevTiming("TTS playback started", turnStartedAt);
            setPhase("speaking");
          }
        },
        turnStartedAt,
      );

      if (turnId === turnIdRef.current) setPhase("idle");
    } catch (err: unknown) {
      if (controller.signal.aborted || turnId !== turnIdRef.current) return;
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setPhase("error");
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  }, [state, cancelCurrentTurn]);

  const reset = useCallback(() => {
    turnIdRef.current += 1;
    cancelCurrentTurn();
    setState(createInitialState());
    setPhase("idle");
    setError(null);
  }, [cancelCurrentTurn]);

  return { state, phase, error, sendMessage, reset };
}

async function playTTS(
  text: string,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  audioUrlRef: React.MutableRefObject<string | null>,
  signal: AbortSignal,
  onPlaybackStart: () => void,
  turnStartedAt: number,
): Promise<void> {
  const ttsStartedAt = performance.now();
  logDevTiming("TTS request started", turnStartedAt);
  let audio: HTMLAudioElement | null = null;
  let audioUrl: string | null = null;

  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({ text }),
    });

    if (signal.aborted) return;

    if (!response.ok) {
      // TTS failure is non-fatal — the text response is already visible.
      console.warn("TTS failed, skipping audio playback");
      return;
    }

    const audioBlob = await response.blob();
    if (signal.aborted) return;
    logDevTiming("TTS audio downloaded", ttsStartedAt);

    audioUrl = URL.createObjectURL(audioBlob);
    audioUrlRef.current = audioUrl;
    audio = new Audio(audioUrl);
    audioRef.current = audio;

    await new Promise<void>((resolve) => {
      let settled = false;
      let playbackStarted = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", finish);
        resolve();
      };

      audio!.onplaying = () => {
        if (!playbackStarted) {
          playbackStarted = true;
          onPlaybackStart();
        }
      };
      audio!.onended = finish;
      audio!.onerror = finish; // Playback failure is non-fatal.
      signal.addEventListener("abort", finish, { once: true });
      audio!.play().catch(finish); // Autoplay may be blocked by the browser.
    });
  } catch {
    // TTS failure should never discard the already-rendered text response.
    if (!signal.aborted) console.warn("TTS playback error, continuing without audio");
  } finally {
    if (audio && audioRef.current === audio) audioRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (audioUrl && audioUrlRef.current === audioUrl) audioUrlRef.current = null;
  }
}

function logDevTiming(label: string, startedAt: number): void {
  if (process.env.NODE_ENV === "development") {
    console.info(`[voice timing] ${label}: ${Math.round(performance.now() - startedAt)}ms`);
  }
}
