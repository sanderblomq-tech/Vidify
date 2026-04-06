export type Sender = "me" | "them";

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

/** Raw script output from the LLM. */
export type RawChatScript = {
  contactName: string;
  messages: ChatMessage[];
};

/** A fully-built script ready to hand to Remotion. */
export type ChatScript = {
  contactName: string;
  messages: ChatMessageWithAudio[];
  totalDurationSec: number;
};
