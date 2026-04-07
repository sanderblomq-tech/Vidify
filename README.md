# Vidify

**Generate viral TikTok/YouTube Shorts conversations in one command.**

Vidify creates fake iMessage-style conversation videos — complete with AI-written scripts, text-to-speech voices, typing indicators, and animated stick figures. Give it a topic, get back 3 ready-to-upload vertical videos.

Two content styles:
- **Timeline Battles** — "Criminal vs Police — who earns more in 5 years"
- **Partner Drama** — "Boyfriend catches girlfriend texting her ex"

https://github.com/user-attachments/assets/placeholder

> One command. Three videos. Zero editing.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Add your GROQ_API_KEY (get one at https://console.groq.com)

# 3. Generate videos
npm run generate -- "Criminal vs Police — who earns more"
```

Output lands on your Desktop in `videfy videos/` as 1080×1920 MP4s, ready to upload.

## Batch Mode

Generate multiple topics at once with auto-picked viral prompts:

```bash
npm run batch
```

## Preview in Remotion Studio

Tweak visuals without regenerating audio:

```bash
npm run studio
```

---

## How It Works

```
Topic → Script → Voices → Video
```

1. **Script** — Groq (Llama 3.3 70B) writes a 10-14 message conversation with a built-in twist moment
2. **Voices** — Edge TTS synthesizes each line with word-level timestamps (female + male voices)
3. **Render** — Remotion composites everything into a vertical MP4: chat bubbles, stick figures with lip-sync, captions, typing dots, and screen shake on the twist

All three videos share the same topic but get unique scripts (`temperature: 0.9`).

## Tech Stack

| Layer | Tech |
|-------|------|
| Script generation | [Groq](https://groq.com) + Llama 3.3 70B |
| Text-to-speech | [Edge TTS](https://github.com/nicholasgasior/edge-tts) (free, no API key needed) |
| Video rendering | [Remotion](https://remotion.dev) |
| Runtime | Node.js + TypeScript |

## Project Structure

```
src/
  generate.ts          CLI entry — generates 3 videos for a topic
  batch.ts             Batch mode — auto-picks topics and generates
  script-generator.ts  Groq prompt + JSON parser
  tts.ts               Edge TTS with word-level timestamps
  pipeline.ts          Orchestrates script → TTS → render
  renderer.ts          Remotion bundler + renderer
  types.ts             Shared types

remotion/
  Video.tsx            Main composition (audio sequences + lip-sync)
  ChatBubble.tsx       iMessage-style chat bubbles
  ChatScreen.tsx       Full chat screen layout
  StickFigure.tsx      SVG stick figure with expressions
  Caption.tsx          Big meme-style word captions
  Background.tsx       Gradient backgrounds
  TypingIndicator.tsx  Typing dots animation
  Camera.tsx           Screen shake on twist moments
  Doodle.tsx           Hand-drawn doodle overlays
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | API key from [Groq Console](https://console.groq.com) |
| `VOICE_A` | No | Edge TTS voice for character A (default: `en-US-JennyNeural`) |
| `VOICE_B` | No | Edge TTS voice for character B (default: `en-US-GuyNeural`) |

## Requirements

- Node.js 18+
- ffmpeg (for audio probing)

## License

MIT
