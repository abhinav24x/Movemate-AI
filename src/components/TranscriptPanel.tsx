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
      <div className="rounded-2xl neon-card p-5">
        <SectionHeader title="Conversation" />
        <div className="flex flex-col items-center justify-center py-9 gap-3">
          <div className="w-11 h-11 rounded-full border border-white/[0.06] bg-white/[0.03] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#333]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <p className="text-sm text-[#555] text-center leading-relaxed">
            Your conversation will appear here
          </p>
          <p className="text-xs text-[#3a3a3a] text-center">
            Tap the microphone or type to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl neon-card p-5 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <SectionHeader title="Conversation" />
        <span className="ml-auto text-[10px] text-[#555] tabular-nums font-mono bg-white/[0.04] px-2 py-0.5 rounded-full">
          {messages.length} msg{messages.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          const isLatestAssistant = !isUser && i === messages.length - 1;

          return (
            <div
              key={i}
              className={`flex gap-2.5 animate-message-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isUser
                    ? "bg-[#1a1a1a] border border-[#2a2a2a]"
                    : "bg-[#39FF14]"
                }`}
                aria-hidden="true"
              >
                {isUser ? (
                  <svg className="w-3.5 h-3.5 text-[#8A8A8A]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
                  </svg>
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#1a1a1a] border border-[#2a2a2a] text-[#F5F5F5] rounded-tr-sm"
                    : isLatestAssistant
                      ? "bg-[#0a1a05] border border-[#39FF14]/20 text-[#F5F5F5] rounded-tl-sm shadow-[0_0_16px_rgba(57,255,20,0.06)]"
                      : "bg-[#121212] border border-[#1e1e1e] text-[#D0D0D0] rounded-tl-sm"
                }`}
              >
                <p className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${
                  isUser ? "text-[#555]" : isLatestAssistant ? "text-[#39FF14]/70" : "text-[#444]"
                }`}>
                  {isUser ? "You" : "MoveMate"}
                </p>
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-[#39FF14] to-[#1fa009]" />
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]">
        {title}
      </h2>
    </div>
  );
}