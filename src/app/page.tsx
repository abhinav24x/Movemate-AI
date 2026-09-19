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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-500/30">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 pointer-events-none" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-xl mx-auto px-4 py-8 pb-16 flex flex-col min-h-screen">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5L21.96 12H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm14 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              MoveMate AI
            </h1>
          </div>
          <p className="text-slate-400 text-sm">Your voice-powered moving assistant</p>
        </header>

        {/* Main voice interaction area */}
        <div className="flex flex-col items-center mb-8 py-6">
          <MicButton
            recordingState={recordingState}
            conversationPhase={phase}
            onClick={toggleRecording}
          />

          {/* Error message */}
          {displayError && (
            <div
              id="error-banner"
              className="mt-4 max-w-sm w-full rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-3 flex items-start gap-2"
            >
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/>
              </svg>
              <p className="text-sm text-red-300 flex-1">{displayError}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-300 flex-shrink-0"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Booking Summary (shown when ready or confirmed) */}
        {(state.status === "ready_for_confirmation" || state.status === "confirmed") && (
          <div className="mb-4">
            <BookingSummary requirements={state.requirements} status={state.status} />
          </div>
        )}

        {/* Transcript */}
        <div className="mb-4">
          <TranscriptPanel messages={state.messages} />
        </div>

        {/* Requirements panel */}
        <div className="mb-6">
          <RequirementsPanel requirements={state.requirements} status={state.status} />
        </div>

        {/* Text input fallback */}
        <div className="mt-auto">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-3">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-medium">
              Text input (fallback)
            </p>
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isBusy}
                placeholder="Type a message... (Enter to send)"
                rows={2}
                className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none disabled:opacity-50 transition-colors"
              />
              <button
                id="send-button"
                onClick={handleTextSubmit}
                disabled={isBusy || !textInput.trim()}
                aria-label="Send message"
                className="px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Reset button */}
          <div className="flex justify-center mt-4">
            <button
              id="reset-button"
              onClick={reset}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-2"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
