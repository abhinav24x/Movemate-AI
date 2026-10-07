# MoveMate AI

> A voice-powered AI moving assistant that books your move through natural conversation.

**[Live Demo →](https://movemate-ai-two.vercel.app/)**

---

## What It Does

MoveMate AI lets you book a moving or transportation service by simply talking to it. Speak into your microphone (or type), and the AI collects all the information it needs — pickup location, drop-off, items, date, time, and vehicle type — through natural back-and-forth conversation.

Once everything is confirmed, it presents a clean booking summary. No forms, no dropdowns, no friction.

---

## Features

- **Voice-first interaction** — speak naturally via browser microphone
- **AI moving assistant** — understands moving requests in plain language
- **Conversational booking** — asks only what it needs, one thing at a time
- **Structured state tracking** — typed, schema-validated booking state
- **Requirement tracking** — real-time progress panel shows what's collected
- **Correction handling** — say "actually, pickup is HSR Layout" and it updates correctly
- **Intentional field clearing** — say "remove the special requirement" and it erases cleanly
- **Speech-to-text** (ElevenLabs Scribe v2) — server-side transcription
- **Text-to-speech** (ElevenLabs Flash v2.5) — assistant speaks back
- **AI responses** (Groq) — fast structured JSON from LLM with model fallback
- **Rate limiting** — lightweight IP-based abuse protection on all API routes
- **Safe error handling** — no raw provider errors ever reach the browser
- **Responsive design** — works on mobile, tablet, and desktop

---

## Architecture

```
User Voice
    ↓
MediaRecorder (browser)
    ↓
/api/transcribe   →  ElevenLabs Scribe v2  →  transcript text
    ↓
/api/agent        →  Groq LLM              →  structured JSON response
    ↓                                         (Zod-validated)
State merge logic (non-destructive, supports intentional clears)
    ↓
Booking State (client-owned, sent each request)
    ↓
/api/speech       →  ElevenLabs Flash v2.5 →  MP3 audio
    ↓
Browser audio playback
```

**Key design decisions:**
- Conversation state is fully client-owned and sent with every request (no database, no sessions)
- Every API response is Zod-validated before being applied to state
- Merge logic preserves existing values when LLM omits fields (prevents accidental data loss)
- Intentional clearing (e.g. "forget the time") is handled via the validated `cleared_fields` list of supported requirement names — distinct from a field simply being absent or `null`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI (LLM) | Groq (`groq/compound`, fallback `qwen/qwen3.8-27b`) |
| Speech-to-Text | ElevenLabs Scribe v2 |
| Text-to-Speech | ElevenLabs Flash v2.5 |
| Validation | Zod |
| Testing | Jest |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com/)
- An [ElevenLabs API key](https://elevenlabs.io/)

### Setup

```bash
# Clone the repo
git clone https://github.com/abhinav24x/Movemate-AI.git
cd Movemate-AI

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

Edit `.env.local` and fill in your API keys:

```env
GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id   # optional, defaults to a preset
```

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Routes

| Route | Method | Description | Rate Limit |
|---|---|---|---|
| `/api/agent` | POST | Processes user message, returns AI response + updated state | 30 req/min |
| `/api/transcribe` | POST | Transcribes audio to text via ElevenLabs | 20 req/min |
| `/api/speech` | POST | Converts text to speech via ElevenLabs | 30 req/min |

All routes return safe, user-friendly errors. No API keys or provider details are ever exposed to the client.

---

## Tests

```bash
npm test
```

Tests cover:
- Schema validation (booking requirements, conversation state, LLM responses)
- State merge logic (preservation, correction, intentional field clearing)
- Rate limiting behavior
- Malformed input rejection
- Edge cases (invalid vehicle type, negative quantity, etc.)

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agent/        # AI conversation endpoint
│   │   ├── speech/       # Text-to-speech endpoint
│   │   └── transcribe/   # Speech-to-text endpoint
│   ├── globals.css       # Design system + animations
│   └── page.tsx          # Main app page
├── components/
│   ├── BookingSummary.tsx    # Booking confirmation card
│   ├── MicButton.tsx         # Voice orb with states
│   ├── RequirementsPanel.tsx # Real-time booking progress
│   └── TranscriptPanel.tsx   # Conversation history
├── hooks/
│   ├── useConversation.ts    # Conversation state management
│   └── useVoiceRecorder.ts   # MediaRecorder integration
└── lib/
    ├── ai/
    │   ├── config.ts         # AI provider config
    │   ├── groq.ts           # Groq LLM client
    │   └── prompts.ts        # System prompt builder
    ├── conversation/
    │   ├── agent.ts          # Conversation orchestrator + merge logic
    │   └── state.ts          # Booking state formatter
    ├── schemas/
    │   ├── agent-response.ts # API request/response schemas
    │   └── requirements.ts   # Booking requirements schema
    ├── voice/
    │   ├── stt.ts            # Speech-to-text wrapper
    │   └── tts.ts            # Text-to-speech wrapper
    └── rate-limit.ts         # In-memory rate limiter
```

---

## Screenshots

<!-- Add screenshots here -->

---

## Notes

- This is a prototype demonstrating conversational AI booking UX. No vehicle is dispatched and no payment is processed.
- The rate limiter uses in-memory storage and resets on cold starts. This is intentional — it provides basic abuse protection without requiring an external KV store.
- Voice recording requires microphone permission in the browser.
