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

/* ── Timing constants (must match renderer.ts) ── */
export const INTRO_SEC = 2.5;
export const GAP_SEC = 0.45;
export const HOLD_SEC = 1.5;

type MessageTiming = { startSec: number; endSec: number };

function computeTimings(
  messages: { durationSec: number }[],
): MessageTiming[] {
  const timings: MessageTiming[] = [];
  let cumulative = INTRO_SEC;

  for (let i = 0; i < messages.length; i++) {
    const gap = i < 2 ? 0.2 : GAP_SEC;
    const startSec = cumulative;
    const endSec = startSec + messages[i].durationSec;
    timings.push({ startSec, endSec });
    cumulative = endSec + gap;
  }

  return timings;
}

/** Total video duration in seconds */
export function computeTotalDuration(
  messages: { durationSec: number }[],
): number {
  const timings = computeTimings(messages);
  if (timings.length === 0) return INTRO_SEC + HOLD_SEC;
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

/* ── INTRO HOOK — big VS splash screen ── */
const IntroHook: React.FC<{
  t: number;
  characterA: string;
  characterB: string;
  title: string;
}> = ({ t, characterA, characterB, title }) => {
  // Animation timeline (seconds)
  // 0.0-0.3: dark overlay fades in
  // 0.3-0.6: character A snaps in from left
  // 0.5-0.8: "VS" pops in with scale
  // 0.7-1.0: character B snaps in from right
  // 1.0-1.4: title fades in
  // 1.4-2.2: hold
  // 2.2-2.5: everything fades out

  const fadeIn = Math.min(1, t / 0.3);
  const fadeOut = t > 2.2 ? 1 - Math.min(1, (t - 2.2) / 0.3) : 1;
  const masterOpacity = fadeIn * fadeOut;

  if (masterOpacity <= 0) return null;

  // Character A: slides from left
  const aProgress = Math.min(1, Math.max(0, (t - 0.2) / 0.25));
  const aEased = 1 - Math.pow(1 - aProgress, 3);
  const aX = -300 + 300 * aEased;
  const aOpacity = aProgress;

  // VS: scale pop
  const vsProgress = Math.min(1, Math.max(0, (t - 0.45) / 0.2));
  const vsEased = 1 - Math.pow(1 - vsProgress, 3);
  const vsScale = 0.3 + 0.7 * vsEased;
  const vsOpacity = vsProgress;

  // Character B: slides from right
  const bProgress = Math.min(1, Math.max(0, (t - 0.6) / 0.25));
  const bEased = 1 - Math.pow(1 - bProgress, 3);
  const bX = 300 - 300 * bEased;
  const bOpacity = bProgress;

  // Title: fades in
  const titleProgress = Math.min(1, Math.max(0, (t - 0.9) / 0.3));
  const titleOpacity = titleProgress;

  // Pulse glow on VS
  const vsPulse = t > 0.65 ? 1 + Math.sin((t - 0.65) * 8) * 0.06 : vsScale;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        opacity: masterOpacity,
        zIndex: 10,
      }}
    >
      {/* Character A name */}
      <div
        style={{
          opacity: aOpacity,
          transform: `translateX(${aX}px)`,
          fontFamily:
            "'Archivo Black', 'Anton', Impact, 'Helvetica Neue', sans-serif",
          fontSize: 100,
          fontWeight: 900,
          color: "#5AC8FA",
          textShadow:
            "0 0 40px rgba(90,200,250,0.5), 0 4px 20px rgba(0,0,0,0.8)",
          textAlign: "center",
          lineHeight: 1.2,
          marginBottom: 30,
        }}
      >
        {characterA}
      </div>

      {/* VS */}
      <div
        style={{
          opacity: vsOpacity,
          transform: `scale(${vsPulse})`,
          fontFamily:
            "'Archivo Black', 'Anton', Impact, 'Helvetica Neue', sans-serif",
          fontSize: 200,
          fontWeight: 900,
          color: "#fff",
          textShadow:
            "0 0 60px rgba(255,255,255,0.4), 0 0 120px rgba(255,100,0,0.3), 0 6px 30px rgba(0,0,0,0.9)",
          letterSpacing: 20,
          lineHeight: 1,
          marginBottom: 30,
        }}
      >
        VS
      </div>

      {/* Character B name */}
      <div
        style={{
          opacity: bOpacity,
          transform: `translateX(${bX}px)`,
          fontFamily:
            "'Archivo Black', 'Anton', Impact, 'Helvetica Neue', sans-serif",
          fontSize: 100,
          fontWeight: 900,
          color: "#FF9500",
          textShadow:
            "0 0 40px rgba(255,149,0,0.5), 0 4px 20px rgba(0,0,0,0.8)",
          textAlign: "center",
          lineHeight: 1.2,
          marginBottom: 50,
        }}
      >
        {characterB}
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
          fontSize: 44,
          fontWeight: 600,
          color: "rgba(255,255,255,0.8)",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: 4,
          textShadow: "0 2px 15px rgba(0,0,0,0.8)",
          maxWidth: 900,
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
    </div>
  );
};

/* ── "VS" Header in chat card ── */
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

  // Chat time = time since intro ended
  const chatT = t;

  // How many messages are visible
  const visibleCount = messageTimings.filter(
    (mt) => chatT >= mt.startSec,
  ).length;
  const visibleMessages = messages.slice(0, visibleCount);

  // Scroll: keep latest N messages visible
  const maxVisible = 7;
  const scrollStart = Math.max(0, visibleCount - maxVisible);
  const displayMessages = visibleMessages.slice(scrollStart);

  // Animate latest bubble
  const latestIdx = visibleCount - 1;
  const latestStart =
    latestIdx >= 0 ? messageTimings[latestIdx].startSec : 0;
  const latestAge = chatT - latestStart;
  const latestProgress = Math.min(1, latestAge / 0.15);

  // Show chat card only after intro
  const chatOpacity = Math.min(1, Math.max(0, (t - (INTRO_SEC - 0.4)) / 0.4));

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

      {/* Intro hook — VS splash screen */}
      {t < INTRO_SEC && (
        <IntroHook
          t={t}
          characterA={characterA}
          characterB={characterB}
          title={title}
        />
      )}

      {/* Floating chat card — fades in as intro ends */}
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
          opacity: chatOpacity,
          transform: `translateY(${(1 - chatOpacity) * 30}px)`,
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
