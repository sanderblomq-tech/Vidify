# Vidify

CLI tool that generates 15-20s TikTok-style stick figure skits about AI.
Two hand-drawn characters — **Blipp** (skeptical, dry) and **Zorp** (hyped,
over-the-top) — banter about whatever topic you hand it, with voices synthesized
by ElevenLabs and animation rendered by Remotion.

One command → 3 ready-to-upload MP4s in `videos/`.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:

   ```bash
   cp .env.example .env
   ```

   You need:
   - `ANTHROPIC_API_KEY` — from https://console.anthropic.com
   - `ELEVENLABS_API_KEY` — from https://elevenlabs.io/app/settings/api-keys
   - `VOICE_ID_A` — a dry/low voice for Blipp (browse https://elevenlabs.io/app/voice-library)
   - `VOICE_ID_B` — an energetic/high voice for Zorp

## Usage

```bash
npm run generate -- "GPT-5 rumors"
```

Output:

```
🎬 Vidify — generating 3 videos about "GPT-5 rumors"
   bundling Remotion composition...
   [1/3] writing script
   [2/3] writing script
   [3/3] writing script
   [1/3] generating voices
   ...
   [1/3] ✓ videos/gpt-5-rumors-abc123-1.mp4
   [2/3] ✓ videos/gpt-5-rumors-abc123-2.mp4
   [3/3] ✓ videos/gpt-5-rumors-abc123-3.mp4
Done in 2m 14s — 3/3 videos rendered.
```

Videos land in `videos/` as `{slug}-{runId}-{1|2|3}.mp4`, 1080×1920, ~15-20s,
H.264 + AAC. Drag them into your TikTok drafts.

## Preview a single video in Remotion Studio

To tweak the visual look with mock data:

```bash
npm run studio
```

This opens the Remotion Studio in your browser with the default mock script.
(Audio won't play since the mock mp3s don't exist — that's fine; you're just
previewing visuals.)

## How it works

1. **Script** — Claude generates a 4-6 line skit as JSON (`src/script-generator.ts`)
2. **Voices** — ElevenLabs synthesizes each line with word-level timestamps (`src/tts.ts`)
3. **Render** — Remotion animates SVG stick figures with lip-flap driven by
   the timestamps, then exports H.264 MP4 (`remotion/Video.tsx`, `src/renderer.ts`)

All three videos in a batch share the same topic but get different scripts
(Claude runs at `temperature: 0.9`).

## Project layout

```
src/
  generate.ts           CLI entry point
  pipeline.ts           script → tts → render for one video
  script-generator.ts   Claude API wrapper
  tts.ts                ElevenLabs wrapper
  renderer.ts           Remotion bundler + renderer
  types.ts              Shared types & character config
remotion/
  index.ts              registerRoot
  Root.tsx              Composition registration
  Video.tsx             Main composition (sequences + lip-flap)
  StickFigure.tsx       SVG character
  Whiteboard.tsx        Background with grid
public/audio/           Generated mp3s (gitignored)
videos/                 Rendered MP4s (gitignored)
```
