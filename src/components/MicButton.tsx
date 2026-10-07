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

  // Label for screen readers and status text
  let label = "Tap to speak";
  let ariaLabel = "Start recording";

  if (recordingState === "requesting") {
    label = "Requesting access…";
    ariaLabel = "Requesting microphone access";
  } else if (isRecording) {
    label = "Listening…";
    ariaLabel = "Stop recording — tap to finish";
  } else if (recordingState === "processing") {
    label = "Transcribing…";
    ariaLabel = "Transcribing your audio";
  } else if (conversationPhase === "processing") {
    label = "Thinking…";
    ariaLabel = "AI is processing your request";
  } else if (isSpeaking) {
    label = "Speaking…";
    ariaLabel = "Assistant is speaking";
  } else if (recordingState === "error") {
    label = "Tap to retry";
    ariaLabel = "Try recording again";
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        id="mic-button"
        onClick={onClick}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-pressed={isRecording}
        className={`relative w-28 h-28 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent ${
          isDisabled ? "cursor-not-allowed opacity-90" : "cursor-pointer hover:scale-105 active:scale-95"
        }`}
      >
        {/* Pulsing rings — recording state */}
        {isRecording && (
          <>
            <span className="animate-mic-ring-1 absolute inset-0 rounded-full bg-red-500/40" />
            <span className="animate-mic-ring-2 absolute inset-0 rounded-full bg-red-500/22" />
            <span className="animate-mic-ring-3 absolute inset-0 rounded-full bg-red-500/12" />
          </>
        )}

        {/* Float aura — idle state */}
        {!isRecording && !isProcessing && !isSpeaking && (
          <span className="absolute inset-[-6px] rounded-full bg-[#39FF14]/[0.06] animate-float-idle" />
        )}

        {/* Main orb */}
        <span
          className={`absolute inset-0 rounded-full transition-all duration-500 ${
            isRecording
              ? "bg-red-500 animate-glow-red"
              : isSpeaking
                ? "bg-[#0a1a05] border-2 border-[#39FF14]/50 animate-glow-green-soft"
                : isProcessing
                  ? "bg-[#111] border border-[#39FF14]/25"
                  : "bg-gradient-to-br from-[#39FF14] via-[#2dd40f] to-[#1fa009] animate-glow-green"
          }`}
        />

        {/* Gloss overlay */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/[0.04] to-white/12 pointer-events-none" />

        {/* Processing — orbiting dot */}
        {isProcessing && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="animate-orbit w-3 h-3 rounded-full bg-[#39FF14] shadow-[0_0_12px_rgba(57,255,20,0.9)]" />
          </span>
        )}

        {/* Speaking — waveform bars */}
        {isSpeaking && (
          <span className="absolute inset-0 flex items-center justify-center gap-[3px]">
            <span className="w-1 rounded-full bg-[#39FF14]/80 h-3 animate-speak-bar origin-bottom" />
            <span className="w-1 rounded-full bg-[#39FF14]/90 h-6 animate-speak-bar-2 origin-bottom" />
            <span className="w-1 rounded-full bg-[#39FF14]    h-8 animate-speak-bar-3 origin-bottom" />
            <span className="w-1 rounded-full bg-[#39FF14]/90 h-6 animate-speak-bar-4 origin-bottom" />
            <span className="w-1 rounded-full bg-[#39FF14]/80 h-3 animate-speak-bar-5 origin-bottom" />
          </span>
        )}

        {/* Recording — stop square */}
        {isRecording && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-8 h-8 rounded-lg bg-white shadow-lg" />
          </span>
        )}

        {/* Idle / error — microphone icon */}
        {!isRecording && !isProcessing && !isSpeaking && (
          <span className="absolute inset-0 flex items-center justify-center text-black">
            <svg
              className="w-10 h-10 drop-shadow-sm"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
          </span>
        )}
      </button>

      {/* Status label */}
      <div className="flex items-center gap-2 min-h-[20px]" aria-live="polite" aria-atomic="true">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
            isRecording  ? "bg-red-400 animate-pulse"      :
            isSpeaking   ? "bg-[#39FF14] animate-pulse"   :
            isProcessing ? "bg-[#39FF14]/60 animate-pulse" :
            "bg-[#39FF14]/35"
          }`}
        />
        <p
          className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
            isRecording  ? "text-red-400"  :
            isSpeaking   ? "text-[#39FF14]" :
            isProcessing ? "text-[#8be870]" :
            "text-[#8A8A8A]"
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}