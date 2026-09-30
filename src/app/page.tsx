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
    if (isProcessing) return "Processing your request…";
    if (isSpeaking) return "MoveMate is responding…";
    if (state.messages.length > 0) return "Continue your conversation";
    return "Where are you moving today?";
  };

  return (
    <div className="min-h-screen text-gray-100 selection:bg-[#00ff88]/20 overflow-x-hidden">

      {/* ─── Atmospheric background ─── */}
      <div className="fixed inset-0 bg-[#050505]" aria-hidden="true" />
      <div className="fixed inset-0 bg-gradient-to-br from-[#050505] via-[#080808] to-[#020802]" aria-hidden="true" />
      {/* Neon green accent glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[500px] bg-[#00ff88]/[0.04] rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[400px] bg-[#00ff88]/[0.03] rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#00ff88]/[0.02] rounded-full blur-[80px] pointer-events-none" aria-hidden="true" />

      {/* ─── Content ─── */}
      <div className="relative max-w-lg mx-auto px-4 py-6 pb-20 flex flex-col min-h-screen">

        {/* ════════════════════════════════════════
            HEADER
        ════════════════════════════════════════ */}
        <header className="flex items-center justify-between neon-header-bar">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-[#00ff88] flex items-center justify-center shadow-lg shadow-[#00ff88]/30">
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5L21.96 12H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm14 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
              {/* Shine overlay */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/15" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-none">
                MoveMate <span className="text-[#00ff88]">AI</span>
              </h1>
              <p className="text-[10px] text-[#3a7a5a] tracking-widest uppercase mt-0.5">
                Voice Moving Assistant
              </p>
            </div>
          </div>

          {/* Status pill */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-medium transition-all duration-500 ${
              isRecording
                ? "bg-red-950/60 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                : isSpeaking
                  ? "bg-[#001a0d] border-[#00ff88]/40 text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.15)]"
                  : isProcessing
                    ? "bg-[#001a0d] border-[#00cc6a]/35 text-[#00cc6a] shadow-[0_0_10px_rgba(0,204,106,0.12)]"
                    : "bg-black/40 border-[#00ff88]/15 text-[#4a9a6a]"
            }`}
            role="status"
            aria-live="polite"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRecording || isSpeaking || isProcessing ? "animate-pulse" : ""
              } ${
                isRecording ? "bg-red-400" :
                isSpeaking ? "bg-[#00ff88]" :
                isProcessing ? "bg-[#00cc6a]" :
                "bg-[#3a7a5a]"
              }`}
            />
            {isRecording ? "Recording" : isSpeaking ? "Speaking" : isProcessing ? "Thinking" : "Ready"}
          </div>
        </header>

        {/* ════════════════════════════════════════
            HERO — Voice interaction centerpiece
        ════════════════════════════════════════ */}
        <section className="flex flex-col items-center mb-10" aria-label="Voice assistant">
          {/* Dynamic tagline */}
          <p
            className="text-sm text-[#4a9a6a] mb-6 h-5 transition-all duration-500 text-center"
            aria-live="polite"
          >
            {getHeroText()}
          </p>

          {/* The voice orb */}
          <MicButton
            recordingState={recordingState}
            conversationPhase={phase}
            onClick={toggleRecording}
          />

          {/* Keyboard hint — only on desktop, only when idle */}
          {!isBusy && !isRecording && (
            <p className="mt-5 text-[11px] text-[#3a7a5a] text-center hidden sm:block">
              Press and speak, or type below
            </p>
          )}

          {/* ─── Error banner ─── */}
          {displayError && (
            <div
              id="error-banner"
              className="mt-5 w-full max-w-sm rounded-xl bg-red-950/50 border border-red-500/25 px-4 py-3 flex items-start gap-2.5 animate-fade-in"
              role="alert"
            >
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/>
              </svg>
              <p className="text-sm text-red-300 flex-1 leading-relaxed">{displayError}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-300 flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            TEXT INPUT (fallback)
        ════════════════════════════════════════ */}
        <div className="mt-auto">
          <div className="rounded-2xl neon-card bg-[#050505] backdrop-blur-xl p-4">
            <p className="text-[10px] text-[#3a7a5a] mb-3 uppercase tracking-[0.14em] font-semibold flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              Text input
            </p>
            <div className="flex gap-2.5">
              <textarea
                ref={textareaRef}
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isBusy}
                placeholder="Type a message… (Enter to send)"
                rows={2}
                aria-label="Text message input"
                className="neon-input flex-1 bg-black/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-200 placeholder-[#3a7a5a] resize-none disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              />
              <button
                id="send-button"
                onClick={handleTextSubmit}
                disabled={isBusy || !textInput.trim()}
                aria-label="Send message"
                className="px-4 rounded-xl bg-[#00ff88] hover:bg-[#00cc6a] active:bg-[#009a4f] disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent flex-shrink-0 shadow-[0_0_20px_rgba(0,255,136,0.4)] hover:shadow-[0_0_30px_rgba(0,255,136,0.55)]"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Reset */}
          <div className="flex justify-center mt-5">
            <button
              id="reset-button"
              onClick={reset}
              className="text-xs text-[#3a7a5a] hover:text-[#00ff88] transition-colors duration-200 flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#00ff88]/50 rounded px-2 py-1"
              aria-label="Start a new conversation"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              Start over
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}