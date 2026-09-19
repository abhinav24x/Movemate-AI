# MoveMate AI 🚛

> A voice-powered AI booking assistant for moving/transportation services.

## Overview

MoveMate AI lets users naturally speak (or type) their moving requirements. The assistant extracts structured booking details, asks targeted follow-up questions for missing information, handles corrections gracefully, and produces a confirmed booking summary.

**This is a technical assessment demonstrating:**
- AI/LLM-driven conversation orchestration (Groq + Llama 3.3-70B)
- Voice I/O pipeline (ElevenLabs Scribe v2 STT + Flash v2.5 TTS)
- Structured state management with Zod validation
- Correction detection and context preservation
- Missing-information detection without hardcoded question sequences

## Architecture

```
Browser
  ├── MediaRecorder (audio capture)
  └── React state (conversation state)
        │
        ▼
Next.js API Routes (server-side, secrets secured)
  ├── POST /api/transcribe  → ElevenLabs STT (scribe_v2)
  ├── POST /api/agent       → Groq LLM (llama-3.3-70b-versatile)
  └── POST /api/speech      → ElevenLabs TTS (eleven_flash_v2_5)
        │
        ▼
Browser (audio playback + state display)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| LLM | Groq API — `llama-3.3-70b-versatile` |
| STT | ElevenLabs — `scribe_v2` |
| TTS | ElevenLabs — `eleven_flash_v2_5` (~75ms latency) |
| Validation | Zod |
| Testing | Jest + ts-jest |

## Setup

### 1. Prerequisites
- Node.js 18+
- Groq API key ([console.groq.com](https://console.groq.com))
- ElevenLabs API key + Voice ID ([elevenlabs.io](https://elevenlabs.io))

### 2. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
GROQ_API_KEY=gsk_...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...  # e.g. 21m00Tcm4TlvDq8ikWAM (Rachel) or any voice from your account
```

To find a Voice ID: ElevenLabs dashboard → Voices → select a voice → copy ID from URL.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Run Tests

```bash
npm test
```

All 33 tests cover schema validation, state merging, missing-field detection, and correction handling — no API credits needed.

### 5. Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main UI
│   ├── layout.tsx                # Root layout + SEO metadata
│   ├── globals.css               # Tailwind + custom styles
│   └── api/
│       ├── transcribe/route.ts   # STT endpoint
│       ├── agent/route.ts        # LLM conversation endpoint
│       └── speech/route.ts       # TTS endpoint
│
├── lib/
│   ├── ai/
│   │   ├── config.ts             # ← Model IDs (change here to swap models)
│   │   ├── groq.ts               # Groq client + structured output parsing
│   │   └── prompts.ts            # System prompt builder
│   │
│   ├── voice/
│   │   ├── elevenlabs.ts         # ElevenLabs singleton client
│   │   ├── stt.ts                # STT wrapper
│   │   └── tts.ts                # TTS wrapper
│   │
│   ├── conversation/
│   │   ├── agent.ts              # Main conversation orchestrator
│   │   └── state.ts              # Booking summary formatter
│   │
│   └── schemas/
│       ├── requirements.ts       # Booking requirements (Zod)
│       └── agent-response.ts     # LLM response + state schemas (Zod)
│
├── hooks/
│   ├── useVoiceRecorder.ts       # MediaRecorder hook
│   └── useConversation.ts        # Agent + TTS integration hook
│
└── components/
    ├── MicButton.tsx             # Animated mic button
    ├── TranscriptPanel.tsx       # Conversation history
    ├── RequirementsPanel.tsx     # Live requirements tracker
    └── BookingSummary.tsx        # Final summary card

__tests__/
└── conversation.test.ts          # 33 unit tests
```

## Changing Model IDs

All model IDs are centralized in [`src/lib/ai/config.ts`](src/lib/ai/config.ts):

```typescript
export const AI_CONFIG = {
  groq: {
    model: "llama-3.3-70b-versatile", // ← change here
  },
  elevenlabs: {
    sttModel: "scribe_v2",             // ← change here
    ttsModel: "eleven_flash_v2_5",     // ← change here
  },
};
```

## Key Design Decisions

### LLM-Driven (Not Scripted)
The conversation is fully driven by the LLM — no hardcoded question sequences. Groq returns a structured JSON response that includes the updated requirements, missing fields, and next question in one call.

### Client-Owned State
Conversation state lives in the browser (React state). Each request sends the full state to the server. This avoids a database while keeping the architecture clean for a demo.

### Safe Merge Strategy
When the LLM updates requirements, we only overwrite fields that are explicitly non-null in the response. This prevents corrections from erasing unrelated data.

### TTS is Non-Fatal
If TTS fails (e.g., quota exceeded), the conversation continues normally — the text is displayed and the user can continue. No crash, no broken state.

## Deployment (Vercel)

```bash
npm i -g vercel
vercel --prod
```

Add the three environment variables in the Vercel dashboard.

---

> ⚠️ **Note:** This is a booking requirements demonstration. No actual vehicle is dispatched, no pricing is shown, and no real-time availability is checked.
