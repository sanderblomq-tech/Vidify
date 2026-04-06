import path from "node:path";
import { generateScript } from "./script-generator.ts";
import { synthesizeMessage } from "./tts.ts";
import { renderVideo } from "./renderer.ts";
import type { ChatScript, ChatMessageWithAudio } from "./types.ts";

type PrepareOptions = {
  topic: string;
  jobId: string;
  projectRoot: string;
  onStage?: (stage: "scripting" | "tts") => void;
};

type RenderOptions = {
  script: ChatScript;
  serveUrl: string;
  outputLocation: string;
  onStage?: (stage: "rendering") => void;
};

/**
 * Phase 1: generate script + TTS for each message.
 */
export async function prepareAssets({
  topic,
  jobId,
  projectRoot,
  onStage,
}: PrepareOptions): Promise<ChatScript> {
  onStage?.("scripting");
  const raw = await generateScript(topic);

  onStage?.("tts");
  const publicDir = path.join(projectRoot, "public");

  const messages: ChatMessageWithAudio[] = [];
  for (let i = 0; i < raw.messages.length; i++) {
    const msg = raw.messages[i];
    const { audioFile, durationSec } = await synthesizeMessage(
      msg.text,
      msg.sender,
      jobId,
      i,
      publicDir,
    );
    messages.push({
      sender: msg.sender,
      text: msg.text,
      audioFile,
      durationSec,
    });
  }

  const totalDurationSec = messages.reduce((s, m) => s + m.durationSec, 0);

  return {
    title: raw.title,
    characterA: raw.characterA,
    characterB: raw.characterB,
    messages,
    totalDurationSec,
  };
}

/**
 * Phase 2: render the debate script to an MP4.
 */
export async function renderFromScript({
  script,
  serveUrl,
  outputLocation,
  onStage,
}: RenderOptions): Promise<string> {
  onStage?.("rendering");
  await renderVideo(serveUrl, script, outputLocation);
  return outputLocation;
}
