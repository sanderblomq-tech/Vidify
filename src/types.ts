export type Sender = "a" | "b";

export type ChatMessage = {
  sender: Sender;
  text: string;
};

/** A message with TTS audio info attached. */
export type ChatMessageWithAudio = {
  sender: Sender;
  text: string;
  audioFile: string; // relative to public/
  durationSec: number;
};

export type CharacterId = Sender;

/** Raw script output from the LLM. */
export type RawChatScript = {
  title: string;
  characterA: string;
  characterB: string;
  messages: ChatMessage[];
  twistIndex: number;
};

/** A fully-built script ready to hand to Remotion. */
export type ChatScript = {
  title: string;
  characterA: string;
  characterB: string;
  messages: ChatMessageWithAudio[];
  totalDurationSec: number;
  twistIndex: number;
};
