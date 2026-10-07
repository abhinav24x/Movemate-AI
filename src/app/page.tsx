"use client";

import { useState, useRef, useCallback } from "react";
import { MicButton } from "@/components/MicButton";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { RequirementsPanel } from "@/components/RequirementsPanel";
import { BookingSummary } from "@/components/BookingSummary";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useConversation } from "@/hooks/useConversation";

export default function Home() {
  const { state, phase, error: conversationError, sendMessage, reset } = useConversation();
  const [textInput, setTextInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscript = useCallback(
    async (text: string) => {
      setErrorMessage(null);
      await sendMessage(text);
    },
    [sendMessage],
  );

  const handleError = useCallback((msg: string) => {
    setErrorMessage(msg);
  }, []);

  const { state: recordingState, toggle: toggleRecording } = useVoiceRecorder({
    onTranscript: handleTranscript,
    onError: handleError,
  });

  const handleTextSubmit = useCallback(async () => {
    const text = textInput.trim();
    if (!text || phase === "processing" || phase === "speaking") return;
    setTextInput("");
    setErrorMessage(null);
    await sendMessage(text);
  }, [textInput, phase, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleTextSubmit();
      }
    },
    [handleTextSubmit],
  );

  const isBusy =
    phase === "processing" ||
    phase === "speaking" ||
    recordingState === "processing";

  const displayError = errorMessage || conversationError;
  const isRecording = recordingState === "recording";
  const isProcessing = recordingState === "processing" || phase === "processing";
  const isSpeaking = phase === "speaking";

  // Hero tagline based on current state
  const getHeroText = () => {
    if (isRecording) return "Listening…";
    if (isProcessing) return "Thinking…";
    if (isSpeaking) return "MoveMate is speaking…";
    if (state.messages.length > 0) return "Continue your conversation";
    return "Where are you moving today?";
  };

  // Status pill config
  const statusConfig = isRecording
    ? { label: "Listening", dot: "bg-red-400", pill: "bg-red-950/70 border-red-500/50 text-red-300 shadow-[0_0_14px_rgba(239,68,68,0.22)]" }
    : isSpeaking
      ? { label: "Speaking", dot: "bg-[#39FF14]", pill: "bg-[#0a1a05]/80 border-[#39FF14]/40 text-[#39FF14] shadow-[0_0_14px_rgba(57,255,20,0.18)]" }
      : isProcessing
        ? { label: "Thinking", dot: "bg-[#39FF14]/70", pill: "bg-[#0a1a05]/80 border-[#39FF14]/30 text-[#8be870] shadow-[0_0_10px_rgba(57,255,20,0.12)]" }
        : { label: "Ready", dot: "bg-[#39FF14]/40", pill: "bg-black/50 border-white/8 text-[#8A8A8A]" };

  return (
    <div className="min-h-screen text-[#F5F5F5] selection:bg-[#39FF14]/20 overflow-x-hidden">

      {/* ─── Atmospheric background ─── */}
      <div className="fixed inset-0 bg-[#050505]" aria-hidden="true" />
      {/* Subtle radial gradients for depth */}
      <div className="fixed top-0 right-0 w-[700px] h-[600px] bg-[#39FF14]/[0.03] rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#39FF14]/[0.025] rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#39FF14]/[0.015] rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

      {/* ─── Content ─── */}
      <div className="relative max-w-lg mx-auto px-4 sm:px-6 py-7 pb-20 flex flex-col min-h-screen">

        {/* ════════════════════════════════════════
            HEADER
        ════════════════════════════════════════ */}
        <header className="flex items-center justify-between neon-header-bar">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-[#39FF14] flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.45)] flex-shrink-0">
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5L21.96 12H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm14 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-white leading-none">
                MoveMate <span className="text-[#39FF14]">AI</span>
              </h1>
              <p className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mt-0.5 font-medium">
                Voice Moving Assistant
              </p>
            </div>
          </div>

          {/* Status pill */}
          <div
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 border text-xs font-medium transition-all duration-400 ${statusConfig.pill}`}
            role="status"
            aria-live="polite"
            aria-label={`Assistant status: ${statusConfig.label}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig.dot} ${isRecording || isSpeaking || isProcessing ? "animate-pulse" : ""}`}
            />
            {statusConfig.label}
          </div>
        </header>

        {/* ════════════════════════════════════════
            HERO — Voice interaction centerpiece
        ════════════════════════════════════════ */}
        <section className="flex flex-col items-center mb-8" aria-label="Voice assistant control">
          {/* Dynamic tagline */}
          <p
            className="text-sm text-[#8A8A8A] mb-7 transition-all duration-400 text-center min-h-[20px]"
            aria-live="polite"
            aria-atomic="true"
          >
            {getHeroText()}
          </p>

          {/* Mic orb */}
          <MicButton
            recordingState={recordingState}
            conversationPhase={phase}
            onClick={toggleRecording}
          />

          {/* Keyboard hint */}
          {!isBusy && !isRecording && (
            <p className="mt-5 text-[11px] text-[#555] text-center hidden sm:block select-none">
              Tap to speak • Or type below
            </p>
          )}

          {/* Error banner */}
          {displayError && (
            <div
              id="error-banner"
              className="mt-5 w-full max-w-sm rounded-xl bg-red-950/60 border border-red-500/30 px-4 py-3 flex items-start gap-2.5 animate-fade-in"
              role="alert"
            >
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/>
              </svg>
              <p className="text-sm text-red-300 flex-1 leading-relaxed">{displayError}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-300 flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded p-0.5"
                aria-label="Dismiss error"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                </svg>
              </button>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════
            BOOKING SUMMARY (ready / confirmed)
        ════════════════════════════════════════ */}
        {(state.status === "ready_for_confirmation" || state.status === "confirmed") && (
          <div className="mb-4">
            <BookingSummary requirements={state.requirements} status={state.status} />
          </div>
        )}

        {/* ════════════════════════════════════════
            CONVERSATION TRANSCRIPT
        ════════════════════════════════════════ */}
        <div className="mb-4">
          <TranscriptPanel messages={state.messages} />
        </div>

        {/* ════════════════════════════════════════
            REQUIREMENTS (trip details)
        ════════════════════════════════════════ */}
        <div className="mb-6">
          <RequirementsPanel requirements={state.requirements} status={state.status} />
        </div>

        {/* ════════════════════════════════════════
            TEXT INPUT (fallback / accessibility)
        ════════════════════════════════════════ */}
        <div className="mt-auto">
          <div className="rounded-2xl neon-card p-4">
            <p className="text-[10px] text-[#8A8A8A] mb-3 uppercase tracking-[0.14em] font-semibold flex items-center gap-1.5">
              <svg className="w-3 h-3 text-[#39FF14]/60" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              Type a message
            </p>
            <div className="flex gap-2.5">
              <textarea
                ref={textareaRef}
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isBusy}
                placeholder="Type here… (Enter to send)"
                rows={2}
                aria-label="Text message input"
                className="neon-input flex-1 rounded-xl px-3.5 py-2.5 text-sm resize-none"
              />
              <button
                id="send-button"
                onClick={handleTextSubmit}
                disabled={isBusy || !textInput.trim()}
                aria-label="Send message"
                className="neon-btn-primary px-4 rounded-xl flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Reset / Start over */}
          <div className="flex justify-center mt-4">
            <button
              id="reset-button"
              onClick={reset}
              className="text-xs text-[#555] hover:text-[#39FF14] transition-colors duration-200 flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#39FF14]/50 rounded px-2 py-1.5"
              aria-label="Start a new conversation"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              Start new conversation
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}