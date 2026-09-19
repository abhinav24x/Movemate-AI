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
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Conversation
        </h2>
        <p className="text-slate-500 text-sm text-center py-6">
          Your conversation will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Conversation
      </h2>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-indigo-600/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600/30 border border-violet-500/30 text-slate-200 rounded-tr-sm"
                  : "bg-slate-700/60 border border-slate-600/40 text-slate-200 rounded-tl-sm"
              }`}
            >
              <p className="text-xs font-semibold mb-1 opacity-60">
                {msg.role === "user" ? "You" : "MoveMate"}
              </p>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-violet-600/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
