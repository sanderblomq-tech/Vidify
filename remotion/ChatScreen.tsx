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
  sender: z.enum(["a", "b"]),
  text: z.string(),
  audioFile: z.string(),
  durationSec: z.number(),
});

export const ChatScreenSchema = z.object({
  title: z.string(),
  characterA: z.string(),
  characterB: z.string(),
  messages: z.array(ChatMessageSchema),
  hasBgVideo: z.boolean().optional(),
});

export type ChatScreenProps = z.infer<typeof ChatScreenSchema>;

/* ── Timing constants (must match Root.tsx & renderer.ts) ── */
export const GAP_SEC = 0.45;
export const HOLD_SEC = 1.5;

type MessageTiming = { startSec: number; endSec: number };

function computeTimings(
  messages: { durationSec: number }[],
): MessageTiming[] {
  const timings: MessageTiming[] = [];
  let cumulative = 0;

  for (let i = 0; i < messages.length; i++) {
    const gap = i < 2 ? 0.2 : GAP_SEC;
    const startSec = i === 0 ? 0 : cumulative;
    if (i > 0) cumulative = startSec;
    const endSec = startSec + messages[i].durationSec;
    timings.push({ startSec, endSec });
    cumulative = endSec + gap;
  }

  return timings;
}

/** Total video duration in seconds — used by Root.tsx and renderer.ts */
export function computeTotalDuration(
  messages: { durationSec: number }[],
): number {
  const timings = computeTimings(messages);
  if (timings.length === 0) return HOLD_SEC;
  const last = timings[timings.length - 1];
  return last.endSec + HOLD_SEC;
}

/* ── Animated gradient fallback background ── */
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

/* ── "VS" Header ── */
const DebateHeader: React.FC<{
  title: string;
  characterA: string;
  characterB: string;
}> = ({ title, characterA, characterB }) => (
  <div
    style={{
      padding: "24px 28px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    {/* Title */}
    <div
      style={{
        textAlign: "center",
        color: "rgba(255,255,255,0.6)",
        fontSize: 24,
        fontFamily: "-apple-system, sans-serif",
        fontWeight: 500,
        marginBottom: 16,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {title}
    </div>

    {/* Character A  VS  Character B */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <span
        style={{
          color: "#5AC8FA",
          fontSize: 32,
          fontWeight: 700,
          fontFamily: "-apple-system, sans-serif",
          textAlign: "right",
          flex: 1,
        }}
      >
        {characterA}
      </span>

      <span
        style={{
          color: "#fff",
          fontSize: 28,
          fontWeight: 900,
          fontFamily: "'Archivo Black', Impact, sans-serif",
          letterSpacing: 3,
          opacity: 0.9,
        }}
      >
        VS
      </span>

      <span
        style={{
          color: "#FF9500",
          fontSize: 32,
          fontWeight: 700,
          fontFamily: "-apple-system, sans-serif",
          textAlign: "left",
          flex: 1,
        }}
      >
        {characterB}
      </span>
    </div>
  </div>
);

/* ── Main Composition ── */
export const ChatScreen: React.FC<ChatScreenProps> = ({
  title,
  characterA,
  characterB,
  messages,
  hasBgVideo = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const messageTimings = computeTimings(messages);

  // How many messages are visible
  const visibleCount = messageTimings.filter((mt) => t >= mt.startSec).length;
  const visibleMessages = messages.slice(0, visibleCount);

  // Scroll: keep latest N messages visible
  const maxVisible = 7;
  const scrollStart = Math.max(0, visibleCount - maxVisible);
  const displayMessages = visibleMessages.slice(scrollStart);

  // Animate latest bubble
  const latestIdx = visibleCount - 1;
  const latestStart = latestIdx >= 0 ? messageTimings[latestIdx].startSec : 0;
  const latestAge = t - latestStart;
  const latestProgress = Math.min(1, latestAge / 0.15);

  return (
    <AbsoluteFill>
      {/* Background — Minecraft gameplay or gradient fallback */}
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
        {/* Debate header */}
        <DebateHeader
          title={title}
          characterA={characterA}
          characterB={characterB}
        />

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
                <ChatBubble
                  sender={msg.sender}
                  text={msg.text}
                  characterA={characterA}
                  characterB={characterB}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Audio sequences */}
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
