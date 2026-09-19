"use client";

import { type RecordingState } from "@/hooks/useVoiceRecorder";

interface MicButtonProps {
  recordingState: RecordingState;
  conversationPhase: "idle" | "processing" | "speaking" | "error";
  onClick: () => void;
}

export function MicButton({ recordingState, conversationPhase, onClick }: MicButtonProps) {
  const isRecording = recordingState === "recording";
  const isProcessing =
    recordingState === "processing" ||
    conversationPhase === "processing";
  const isSpeaking = conversationPhase === "speaking";
  const isDisabled = isProcessing || isSpeaking || recordingState === "requesting";

  let label = "Tap to speak";
  let ariaLabel = "Start recording";

  if (recordingState === "requesting") {
    label = "Requesting mic...";
    ariaLabel = "Requesting microphone access";
  } else if (isRecording) {
    label = "Listening...";
    ariaLabel = "Stop recording";
  } else if (recordingState === "processing") {
    label = "Transcribing...";
    ariaLabel = "Transcribing audio";
  } else if (conversationPhase === "processing") {
    label = "Thinking...";
    ariaLabel = "AI is processing";
  } else if (isSpeaking) {
    label = "Speaking...";
    ariaLabel = "Assistant is speaking";
  } else if (recordingState === "error") {
    label = "Try again";
    ariaLabel = "Try recording again";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        id="mic-button"
        onClick={onClick}
        disabled={isDisabled}
        aria-label={ariaLabel}
        className={`
          relative w-24 h-24 rounded-full transition-all duration-300 focus:outline-none focus:ring-4
          ${isDisabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:scale-105 active:scale-95"
          }
          ${isRecording
            ? "bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)] focus:ring-red-400/50"
            : isSpeaking
              ? "bg-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.5)] focus:ring-indigo-400/50"
              : isProcessing
                ? "bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)] focus:ring-amber-400/50"
                : "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_30px_rgba(139,92,246,0.4)] focus:ring-violet-400/50"
          }
        `}
      >
        {/* Pulse ring when recording */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
            <span className="absolute inset-[-8px] rounded-full border-2 border-red-400/40 animate-pulse" />
          </>
        )}

        {/* Speaking pulse */}
        {isSpeaking && (
          <span className="absolute inset-0 rounded-full bg-indigo-400 opacity-20 animate-pulse" />
        )}

        {/* Icon */}
        <span className="relative flex items-center justify-center w-full h-full text-white">
          {isRecording ? (
            /* Stop square */
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : isProcessing ? (
            /* Spinner */
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isSpeaking ? (
            /* Sound wave icon */
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
            </svg>
          ) : (
            /* Microphone icon */
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
          )}
        </span>
      </button>

      <p className={`text-sm font-medium tracking-wide transition-colors ${
        isRecording ? "text-red-400" :
        isSpeaking ? "text-indigo-400" :
        isProcessing ? "text-amber-400" :
        "text-slate-400"
      }`}>
        {label}
      </p>
    </div>
  );
}
