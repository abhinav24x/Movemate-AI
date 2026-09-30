"use client";

import { useRef, useEffect } from "react";
import type { ConversationMessage } from "@/lib/schemas/agent-response";

interface TranscriptPanelProps {
  messages: ConversationMessage[];
}

export function TranscriptPanel({ messages }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl neon-card bg-[#050505] backdrop-blur-xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#00ff88] to-[#00cc6a]" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4a9a6a]">
            Conversation
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <p className="text-[#4a9a6a] text-sm text-center leading-relaxed">
            Your conversation will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl neon-card bg-[#050505] backdrop-blur-xl p-5 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#00ff88] to-[#00cc6a]" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4a9a6a]">
          Conversation
        </h2>
        <span className="ml-auto text-xs text-[#4a9a6a] tabular-nums">{messages.length}</span>
      </div>

      <div className="space-y-4 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-message-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "assistant"
                  ? "bg-[#00ff88]"
                  : "bg-[#1a1a1a] border border-[#333]"
              }`}
              aria-hidden="true"
            >
              {msg.role === "assistant" ? (
                <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#00ff88]/10 border border-[#00ff88]/20 text-gray-200 rounded-tr-sm"
                  : "bg-[#0d0d0d] border border-[#00ff88]/[0.07] text-gray-200 rounded-tl-sm"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-50">
                {msg.role === "user" ? "You" : "MoveMate"}
              </p>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}