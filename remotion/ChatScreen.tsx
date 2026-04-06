import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { ChatBubble } from "./ChatBubble";

export const ChatMessageSchema = z.object({
  sender: z.enum(["me", "them"]),
  text: z.string(),
  audioFile: z.string(),
  durationSec: z.number(),
});

export const ChatScreenSchema = z.object({
  contactName: z.string(),
  messages: z.array(ChatMessageSchema),
  hasBgVideo: z.boolean().optional(),
});

export type ChatScreenProps = z.infer<typeof ChatScreenSchema>;

const FPS = 30;
/** Small gap of silence between messages */
const GAP_SEC = 0.45;

/**
 * iMessage conversation with TTS narration per message.
 * Each bubble appears when its audio starts playing.
 */
export const ChatScreen: React.FC<ChatScreenProps> = ({
  contactName,
  messages,
  hasBgVideo = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Calculate start time for each message
  // First message starts immediately (no gap), then normal gap after
  const messageTimings: { startSec: number; endSec: number }[] = [];
  let cumulative = 0;
  for (let i = 0; i < messages.length; i++) {
    const startSec = cumulative;
    const endSec = startSec + messages[i].durationSec;
    messageTimings.push({ startSec, endSec });
    // Shorter gap after first few messages to feel fast, then normal
    const gap = i < 2 ? 0.2 : GAP_SEC;
    cumulative = endSec + gap;
  }

  // How many messages are visible at current time
  const visibleCount = messageTimings.filter((mt) => t >= mt.startSec).length;
  const visibleMessages = messages.slice(0, visibleCount);

  // Show max 7 messages, scroll older ones
  const maxVisible = 7;
  const scrollStart = Math.max(0, visibleCount - maxVisible);
  const displayMessages = visibleMessages.slice(scrollStart);

  // Latest bubble animation
  const latestIdx = visibleCount - 1;
  const latestStart = latestIdx >= 0 ? messageTimings[latestIdx].startSec : 0;
  const latestAge = t - latestStart;
  const latestProgress = Math.min(1, latestAge / 0.15);

  return (
    <AbsoluteFill>
      {/* Background */}
      {hasBgVideo ? (
        <OffthreadVideo
          src={staticFile("bg.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
      ) : (
        <AnimatedBackground />
      )}

      {/* Floating chat card */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 40,
          right: 40,
          borderRadius: 30,
          overflow: "hidden",
          backgroundColor: "rgba(0, 0, 0, 0.82)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                color: "#007AFF",
                fontSize: 40,
                fontFamily: "-apple-system, sans-serif",
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              ‹
            </span>
            <span
              style={{
                fontFamily: "-apple-system, sans-serif",
                backgroundColor: "#007AFF",
                width: 36,
                height: 36,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              6
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#636366",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#fff",
                  fontFamily: "-apple-system, sans-serif",
                }}
              >
                {contactName
                  .replace(/[\p{Emoji}\u200d\ufe0f]/gu, "")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
            <span
              style={{
                color: "#fff",
                fontFamily: "-apple-system, sans-serif",
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              {contactName}
            </span>
          </div>

          <span style={{ fontSize: 28 }}>📹</span>
        </div>

        {/* Messages */}
        <div style={{ padding: "16px 16px 24px", minHeight: 200 }}>
          {displayMessages.map((msg, i) => {
            const globalIdx = scrollStart + i;
            const isLatest = globalIdx === latestIdx;
            const opacity = isLatest ? latestProgress : 1;
            const translateY = isLatest ? (1 - latestProgress) * 20 : 0;

            return (
              <div
                key={globalIdx}
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                }}
              >
                <ChatBubble sender={msg.sender} text={msg.text} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Audio sequences — each message gets its own audio */}
      {messages.map((msg, i) => {
        const startFrame = Math.round(messageTimings[i].startSec * fps);
        const durationFrames = Math.round(msg.durationSec * fps);
        return (
          <Sequence
            key={i}
            from={startFrame}
            durationInFrames={durationFrames}
            layout="none"
          >
            <Audio src={staticFile(msg.audioFile)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const AnimatedBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const hue1 = (t * 15) % 360;
  const hue2 = (hue1 + 140) % 360;
  const angle = (t * 8) % 360;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(${angle}deg, hsl(${hue1}, 60%, 15%), hsl(${hue2}, 70%, 10%))`,
      }}
    />
  );
};
