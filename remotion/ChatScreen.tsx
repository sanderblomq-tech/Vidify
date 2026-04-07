import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { ChatBubble } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";

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
  twistIndex: z.number().optional(),
  hasBgVideo: z.boolean().optional(),
});

export type ChatScreenProps = z.infer<typeof ChatScreenSchema>;

/* ── Timing constants (must match renderer.ts) ── */
export const INTRO_SEC = 1.5;
export const GAP_SEC = 0.3;
export const HOLD_SEC = 0.8;
const TYPING_SEC = 0.5; // Typing indicator duration within the gap

type MessageTiming = { startSec: number; endSec: number; typingStartSec: number };

function computeTimings(
  messages: { durationSec: number }[],
): MessageTiming[] {
  const timings: MessageTiming[] = [];
  let cumulative = INTRO_SEC;

  for (let i = 0; i < messages.length; i++) {
    const gap = i < 2 ? 0.2 : GAP_SEC;
    const typingStartSec = i === 0 ? cumulative : cumulative - Math.min(TYPING_SEC, gap);
    const startSec = cumulative;
    const endSec = startSec + messages[i].durationSec;
    timings.push({ startSec, endSec, typingStartSec });
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

/* ── INTRO HOOK — big VS splash screen ── */
const IntroHook: React.FC<{
  t: number;
  fps: number;
  characterA: string;
  characterB: string;
  title: string;
}> = ({ t, fps, characterA, characterB, title }) => {
  const fadeIn = Math.min(1, t / 0.15);
  const fadeOut = t > 1.2 ? 1 - Math.min(1, (t - 1.2) / 0.3) : 1;
  const masterOpacity = fadeIn * fadeOut;

  if (masterOpacity <= 0) return null;

  // Character A: slides from left with spring
  const aProgress = Math.min(1, Math.max(0, (t - 0.1) / 0.15));
  const aEased = 1 - Math.pow(1 - aProgress, 3);
  const aX = -300 + 300 * aEased;
  const aOpacity = aProgress;

  // VS: scale pop
  const vsProgress = Math.min(1, Math.max(0, (t - 0.25) / 0.15));
  const vsEased = 1 - Math.pow(1 - vsProgress, 3);
  const vsScale = 0.3 + 0.7 * vsEased;
  const vsOpacity = vsProgress;

  // Character B: slides from right
  const bProgress = Math.min(1, Math.max(0, (t - 0.35) / 0.15));
  const bEased = 1 - Math.pow(1 - bProgress, 3);
  const bX = 300 - 300 * bEased;
  const bOpacity = bProgress;

  // Title: fades in
  const titleProgress = Math.min(1, Math.max(0, (t - 0.5) / 0.2));
  const titleOpacity = titleProgress;

  // Pulse glow on VS
  const vsPulse = t > 0.4 ? 1 + Math.sin((t - 0.4) * 10) * 0.06 : vsScale;

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
          color: "#007AFF",
          textShadow:
            "0 0 40px rgba(0,122,255,0.5), 0 4px 20px rgba(0,0,0,0.8)",
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
          color: "#34C759",
          textShadow:
            "0 0 40px rgba(52,199,89,0.5), 0 4px 20px rgba(0,0,0,0.8)",
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

/* ── iOS Messages app header (authentic look) ── */
const MessagesHeader: React.FC<{
  title: string;
}> = ({ title }) => (
  <div
    style={{
      backgroundColor: "#1C1C1E",
      padding: "14px 16px 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
    }}
  >
    {/* Back arrow — left side */}
    <div
      style={{
        position: "absolute",
        left: 16,
        top: 18,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span
        style={{
          color: "#007AFF",
          fontSize: 32,
          fontWeight: 300,
          fontFamily: "-apple-system, sans-serif",
          lineHeight: 1,
        }}
      >
        ‹
      </span>
      <div
        style={{
          backgroundColor: "#007AFF",
          borderRadius: 12,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: 17,
            fontWeight: 600,
            fontFamily: "-apple-system, sans-serif",
          }}
        >
          2
        </span>
      </div>
    </div>

    {/* FaceTime icon — right side */}
    <div
      style={{
        position: "absolute",
        right: 16,
        top: 18,
      }}
    >
      <svg width="30" height="22" viewBox="0 0 30 22" fill="none">
        <rect x="0" y="2" width="20" height="18" rx="4" fill="#007AFF" />
        <path d="M22 7l6-3v14l-6-3V7z" fill="#007AFF" />
      </svg>
    </div>

    {/* Contact avatar */}
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#636366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
      }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="10" r="5.5" fill="#AEAEB2" />
        <ellipse cx="14" cy="25" rx="9" ry="7" fill="#AEAEB2" />
      </svg>
    </div>

    {/* Contact name */}
    <div
      style={{
        color: "#fff",
        fontSize: 22,
        fontWeight: 600,
        fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
        textAlign: "center",
      }}
    >
      {title}
    </div>
  </div>
);

/* ── Emoji reaction that pops up on twist ── */
const EmojiReaction: React.FC<{
  frame: number;
  fps: number;
  isLeftAligned: boolean;
}> = ({ frame, fps, isLeftAligned }) => {
  const scale = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 200 },
  });

  const floatY = interpolate(frame, [0, fps * 0.5], [0, -8], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.sin),
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: -8,
        ...(isLeftAligned ? { left: -10 } : { right: -10 }),
        transform: `scale(${scale}) translateY(${floatY}px)`,
        transformOrigin: "center bottom",
        fontSize: 36,
        zIndex: 5,
      }}
    >
      💀
    </div>
  );
};

/* ── Main Composition ── */
export const ChatScreen: React.FC<ChatScreenProps> = ({
  title,
  characterA,
  characterB,
  messages,
  twistIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const messageTimings = computeTimings(messages);

  // Resolve twist index — default to 3rd-to-last
  const resolvedTwistIndex = twistIndex ?? Math.max(0, messages.length - 3);

  // How many messages are visible
  const visibleCount = messageTimings.filter(
    (mt) => t >= mt.startSec,
  ).length;
  const visibleMessages = messages.slice(0, visibleCount);

  // Scroll: keep latest N messages visible with smooth animation
  const maxVisible = 7;
  const scrollStart = Math.max(0, visibleCount - maxVisible);
  const displayMessages = visibleMessages.slice(scrollStart);

  // Smooth scroll offset — animate when messages scroll out
  const scrollProgress = visibleCount > maxVisible
    ? interpolate(
        t,
        [
          messageTimings[visibleCount - 1]?.startSec ?? 0,
          (messageTimings[visibleCount - 1]?.startSec ?? 0) + 0.15,
        ],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 0;
  // Approximate height of one bubble for smooth scroll (padding + font + margin)
  const bubbleHeight = 62;
  const smoothScrollY = scrollProgress > 0 ? -scrollProgress * bubbleHeight : 0;

  // Animate latest bubble
  const latestIdx = visibleCount - 1;
  const latestStart =
    latestIdx >= 0 ? messageTimings[latestIdx].startSec : 0;
  const latestAge = t - latestStart;
  const latestProgress = Math.min(1, latestAge / 0.15);

  // Show chat card only after intro
  const chatOpacity = Math.min(1, Math.max(0, (t - (INTRO_SEC - 0.3)) / 0.3));

  // Screen shake on twist message
  const twistTiming = messageTimings[resolvedTwistIndex];
  let shakeX = 0;
  let shakeY = 0;
  if (twistTiming && t >= twistTiming.startSec && t < twistTiming.startSec + 0.3) {
    const shakeT = t - twistTiming.startSec;
    const shakeIntensity = interpolate(shakeT, [0, 0.3], [5, 0], {
      extrapolateRight: "clamp",
    });
    shakeX = Math.sin(shakeT * 60) * shakeIntensity;
    shakeY = Math.cos(shakeT * 45) * shakeIntensity * 0.6;
  }

  // Typing indicator: show during gap before next message appears
  const nextToAppear = visibleCount; // index of the message about to appear
  const showTyping =
    nextToAppear < messages.length &&
    t >= messageTimings[nextToAppear].typingStartSec &&
    t < messageTimings[nextToAppear].startSec;

  // Determine receipt status for each visible Character B message
  function getReceipt(globalIdx: number): "none" | "delivered" | "read" {
    if (messages[globalIdx].sender !== "b") return "none";

    // Find next message from A after this one
    const nextFromA = messageTimings.findIndex(
      (_, j) => j > globalIdx && messages[j].sender === "a",
    );

    // If next A message has appeared → "Read", otherwise "Delivered"
    if (nextFromA >= 0 && t >= messageTimings[nextFromA].startSec) {
      return "read";
    }

    // Only show "Delivered" after the message audio finishes
    if (t >= messageTimings[globalIdx].endSec) {
      return "delivered";
    }

    return "none";
  }

  // Check if twist reaction should show
  const twistMessageVisible = visibleCount > resolvedTwistIndex;
  const twistReactionDelay = 0.3; // Show reaction 0.3s after twist message
  const showTwistReaction =
    twistTiming &&
    twistMessageVisible &&
    t >= twistTiming.startSec + twistReactionDelay;
  const twistReactionFrame = showTwistReaction
    ? Math.round((t - twistTiming.startSec - twistReactionDelay) * fps)
    : 0;

  return (
    <AbsoluteFill>
      {/* Background — always Minecraft gameplay */}
      <OffthreadVideo
        src={staticFile("bg.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        muted
      />

      {/* Screen shake wrapper */}
      <AbsoluteFill
        style={{
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Intro hook — VS splash screen */}
        {t < INTRO_SEC && (
          <IntroHook
            t={t}
            fps={fps}
            characterA={characterA}
            characterB={characterB}
            title={title}
          />
        )}

        {/* Floating iOS Messages island */}
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 36,
            right: 36,
            borderRadius: 40,
            overflow: "hidden",
            backgroundColor: "#000",
            boxShadow:
              "0 12px 50px rgba(0,0,0,0.4), 0 2px 10px rgba(0,0,0,0.2)",
            opacity: chatOpacity,
            transform: `translateY(${(1 - chatOpacity) * 30}px)`,
          }}
        >
          {/* iOS Messages header */}
          <MessagesHeader title={title} />

          {/* Messages */}
          <div
            style={{
              padding: "12px 14px 20px",
              minHeight: 200,
              transform: `translateY(${smoothScrollY}px)`,
            }}
          >
            {displayMessages.map((msg, i) => {
              const globalIdx = scrollStart + i;
              const isLatest = globalIdx === latestIdx;
              const opacity = isLatest ? latestProgress : 1;
              const translateY = isLatest ? (1 - latestProgress) * 20 : 0;
              const isTwist = globalIdx === resolvedTwistIndex;

              return (
                <div
                  key={globalIdx}
                  style={{
                    opacity,
                    transform: `translateY(${translateY}px)`,
                    position: "relative",
                  }}
                >
                  <ChatBubble
                    sender={msg.sender}
                    text={msg.text}
                    characterA={characterA}
                    characterB={characterB}
                    receipt={getReceipt(globalIdx)}
                  />
                  {/* Emoji reaction on twist message */}
                  {isTwist && showTwistReaction && (
                    <EmojiReaction
                      frame={twistReactionFrame}
                      fps={fps}
                      isLeftAligned={msg.sender === "a"}
                    />
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {showTyping && <TypingIndicator />}
          </div>
        </div>
      </AbsoluteFill>

      {/* ── SFX: Intro sounds ── */}
      <Sequence
        from={Math.round(0.1 * fps)}
        durationInFrames={Math.round(0.3 * fps)}
        layout="none"
      >
        <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.5} />
      </Sequence>
      <Sequence
        from={Math.round(0.25 * fps)}
        durationInFrames={Math.round(0.4 * fps)}
        layout="none"
      >
        <Audio src={staticFile("sfx/impact.mp3")} volume={0.6} />
      </Sequence>
      <Sequence
        from={Math.round(0.35 * fps)}
        durationInFrames={Math.round(0.3 * fps)}
        layout="none"
      >
        <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.5} />
      </Sequence>

      {/* ── Riser SFX before twist ── */}
      {twistTiming && (
        <Sequence
          from={Math.max(0, Math.round((twistTiming.startSec - 1.2) * fps))}
          durationInFrames={Math.round(1.5 * fps)}
          layout="none"
        >
          <Audio src={staticFile("sfx/riser.mp3")} volume={0.35} />
        </Sequence>
      )}

      {/* ── Voice + SFX per message ── */}
      {messages.map((msg, i) => {
        const startFrame = Math.round(messageTimings[i].startSec * fps);
        const durationFrames = Math.round(msg.durationSec * fps);
        const typingStartFrame = Math.round(
          messageTimings[i].typingStartSec * fps,
        );
        const typingDuration = startFrame - typingStartFrame;

        return [
          /* Voice audio */
          <Sequence
            key={`voice-${i}`}
            from={startFrame}
            durationInFrames={durationFrames}
            layout="none"
          >
            <Audio src={staticFile(msg.audioFile)} />
          </Sequence>,

          /* Pop SFX on message appear */
          <Sequence
            key={`pop-${i}`}
            from={startFrame}
            durationInFrames={Math.round(0.3 * fps)}
            layout="none"
          >
            <Audio src={staticFile("sfx/pop.mp3")} volume={0.4} />
          </Sequence>,

          /* Typing SFX during indicator */
          typingDuration > 0 && i > 0 ? (
            <Sequence
              key={`typing-${i}`}
              from={typingStartFrame}
              durationInFrames={typingDuration}
              layout="none"
            >
              <Audio src={staticFile("sfx/typing.mp3")} volume={0.25} />
            </Sequence>
          ) : null,

          /* Ding SFX on "Delivered" receipt (only for sender B) */
          msg.sender === "b" ? (
            <Sequence
              key={`ding-${i}`}
              from={Math.round(messageTimings[i].endSec * fps)}
              durationInFrames={Math.round(0.2 * fps)}
              layout="none"
            >
              <Audio src={staticFile("sfx/ding.mp3")} volume={0.2} />
            </Sequence>
          ) : null,
        ];
      })}
    </AbsoluteFill>
  );
};
