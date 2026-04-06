import path from "node:path";
import { existsSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { ChatScript } from "./types.ts";

const COMPOSITION_ID = "VidifyChat";
const FPS = 30;

/* Timing constants — must match remotion/ChatScreen.tsx */
const INTRO_SEC = 2.5;
const GAP_SEC = 0.45;
const HOLD_SEC = 1.5;

let cachedServeUrl: string | null = null;
let cachedHasBgVideo = false;

export async function prepareBundle(projectRoot: string): Promise<string> {
  if (cachedServeUrl) return cachedServeUrl;

  const entryPoint = path.join(projectRoot, "remotion", "index.ts");
  const publicDir = path.join(projectRoot, "public");
  cachedHasBgVideo = existsSync(path.join(publicDir, "bg.mp4"));

  const serveUrl = await bundle({
    entryPoint,
    publicDir,
  });

  cachedServeUrl = serveUrl;
  return serveUrl;
}

function computeTotalDuration(
  messages: { durationSec: number }[],
): number {
  let cumulative = INTRO_SEC;
  for (let i = 0; i < messages.length; i++) {
    const gap = i < 2 ? 0.2 : GAP_SEC;
    cumulative += messages[i].durationSec + gap;
  }
  return cumulative + HOLD_SEC;
}

/**
 * Render a debate video with TTS audio.
 */
export async function renderVideo(
  serveUrl: string,
  script: ChatScript,
  outputLocation: string,
): Promise<void> {
  const inputProps = {
    title: script.title,
    characterA: script.characterA,
    characterB: script.characterB,
    messages: script.messages,
    hasBgVideo: cachedHasBgVideo,
  };

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });

  const totalSec = computeTotalDuration(script.messages);
  const totalFrames = Math.max(1, Math.round(totalSec * FPS));

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: totalFrames,
    },
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps,
    timeoutInMilliseconds: 120000,
  });
}
