import { mkdir, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { EdgeTTS, Constants } from "@andresaya/edge-tts";
import type { Sender } from "./types.ts";

/** Two distinct voices — female (a) and male (b) */
const VOICES: Record<Sender, string> = {
  a: process.env.VOICE_A || "en-US-AvaMultilingualNeural",
  b: process.env.VOICE_B || "en-US-AndrewMultilingualNeural",
};

export type TtsResult = {
  audioFile: string;
  durationSec: number;
};

/** Get actual audio duration via ffprobe */
function probeDuration(filePath: string): number {
  try {
    const out = execFileSync("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=nw=1:nokey=1",
      filePath,
    ], { stdio: "pipe" }).toString().trim();
    const sec = parseFloat(out);
    return Number.isFinite(sec) ? sec : 0;
  } catch {
    return 0;
  }
}

/**
 * Synthesize one chat message with Edge TTS (free, no API key).
 * Converts to 44.1kHz stereo mp3 via ffmpeg for Remotion compatibility.
 */
export async function synthesizeMessage(
  text: string,
  sender: Sender,
  jobId: string,
  lineIndex: number,
  publicDir: string,
): Promise<TtsResult> {
  const voice = VOICES[sender];

  const relativeDir = join("audio", jobId);
  const absDir = join(publicDir, relativeDir);
  await mkdir(absDir, { recursive: true });

  const baseName = `line-${lineIndex}`;
  const fileName = `${baseName}.mp3`;
  const rawPath = join(absDir, `${baseName}.raw.mp3`);
  const finalPath = join(absDir, fileName);

  // Retry up to 3 times if TTS produces invalid output
  for (let attempt = 0; attempt < 3; attempt++) {
    const tts = new EdgeTTS();
    await tts.synthesize(text, voice, {
      outputFormat: Constants.OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    });
    await tts.toFile(join(absDir, `${baseName}.raw`));

    const fileInfo = await stat(rawPath);
    if (fileInfo.size > 1000) break;

    await new Promise((r) => setTimeout(r, 300));
  }

  // Convert to 44.1kHz stereo for Remotion compatibility
  try {
    execFileSync("ffmpeg", [
      "-y",
      "-i", rawPath,
      "-ar", "44100",
      "-ac", "2",
      "-b:a", "192k",
      finalPath,
    ], { stdio: "pipe" });
  } catch {
    const { renameSync } = await import("node:fs");
    renameSync(rawPath, finalPath);
  }

  // Use ffprobe for accurate duration instead of Edge TTS estimate
  const durationSec = probeDuration(finalPath) + 0.3;

  return {
    audioFile: join(relativeDir, fileName),
    durationSec: Math.max(0.5, durationSec),
  };
}
