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
    <div className="flex flex-col items-center gap-4">
      <button
        id="mic-button"
        onClick={onClick}
        disabled={isDisabled}
        aria-label={ariaLabel}
        className={`relative w-28 h-28 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${isDisabled ? "cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"}`}
      >
        {isRecording && (
          <>
            <span className="animate-mic-ring-1 absolute inset-0 rounded-full bg-red-500/40" />
            <span className="animate-mic-ring-2 absolute inset-0 rounded-full bg-red-500/25" />
            <span className="animate-mic-ring-3 absolute inset-0 rounded-full bg-red-500/12" />
          </>
        )}
        {!isRecording && !isProcessing && !isSpeaking && (
          <span className="absolute inset-[-4px] rounded-full bg-violet-600/10 animate-float-idle" />
        )}
        <span
          className={`absolute inset-0 rounded-full transition-all duration-500 ${isRecording ? "bg-red-500 animate-glow-red" : isSpeaking ? "bg-indigo-500 animate-glow-indigo" : isProcessing ? "bg-slate-700" : "bg-gradient-to-br from-violet-500 via-indigo-600 to-violet-700 animate-glow-violet"}`}
        />
        <span className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/5 to-white/10" />
        {isProcessing && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="animate-orbit w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
          </span>
        )}
        {isSpeaking && (
          <span className="absolute inset-0 flex items-center justify-center gap-[3px]">
            <span className="w-1 rounded-full bg-white/90 h-4 animate-speak-bar" />
            <span className="w-1 rounded-full bg-white/90 h-7 animate-speak-bar-2" />
            <span className="w-1 rounded-full bg-white/90 h-9 animate-speak-bar-3" />
            <span className="w-1 rounded-full bg-white/90 h-7 animate-speak-bar-4" />
            <span className="w-1 rounded-full bg-white/90 h-4 animate-speak-bar-5" />
          </span>
        )}
        {isRecording && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-8 h-8 rounded-md bg-white/95 shadow-lg" />
          </span>
        )}
        {!isRecording && !isProcessing && !isSpeaking && (
          <span className="absolute inset-0 flex items-center justify-center text-white">
            <svg className="w-9 h-9 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
          </span>
        )}
      </button>
      <div className="flex items-center gap-2 h-5">
        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isRecording ? "bg-red-400 animate-pulse" : isSpeaking ? "bg-indigo-400 animate-pulse" : isProcessing ? "bg-amber-400 animate-pulse" : "bg-slate-600"}`} />
        <p className={`text-sm font-medium tracking-wide transition-colors duration-300 ${isRecording ? "text-red-400" : isSpeaking ? "text-indigo-400" : isProcessing ? "text-amber-400" : "text-slate-500"}`}>
          {label}
        </p>
      </div>
    </div>
  );
}