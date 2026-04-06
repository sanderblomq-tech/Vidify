import path from "node:path";
import { existsSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { ChatScript } from "./types.ts";

const COMPOSITION_ID = "VidifyChat";
const FPS = 30;
const GAP_SEC = 0.45; // must match ChatScreen.tsx

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

/**
 * Render a chat video with TTS audio.
 */
export async function renderVideo(
  serveUrl: string,
  script: ChatScript,
  outputLocation: string,
): Promise<void> {
  const inputProps = {
    contactName: script.contactName,
    messages: script.messages,
    hasBgVideo: cachedHasBgVideo,
  };

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });

  // Total duration = sum of all message durations + gaps + 1s hold
  const totalSec =
    script.totalDurationSec +
    script.messages.length * GAP_SEC +
    1;
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
  });
}
