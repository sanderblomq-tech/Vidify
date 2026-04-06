import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Background } from "./Background";
import { StickFigure, type Expression } from "./StickFigure";
import { Caption } from "./Caption";

export const WordTimestampSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
});

export const LineSchema = z.object({
  character: z.enum(["a", "b"]),
  text: z.string(),
  audioFile: z.string(),
  durationSec: z.number(),
  wordTimestamps: z.array(WordTimestampSchema),
  doodle: z.string().nullable().optional(),
});

export const VideoSchema = z.object({
  lines: z.array(LineSchema),
});

export type VideoProps = z.infer<typeof VideoSchema>;

const FPS = 30;

const findActive = (
  lines: VideoProps["lines"],
  t: number,
): { idx: number; localT: number } => {
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const end = start + lines[i].durationSec;
    if (t < end) return { idx: i, localT: t - start };
    start = end;
  }
  const last = lines.length - 1;
  return { idx: last, localT: lines[last].durationSec };
};

function expressionForLine(
  lineIdx: number,
  totalLines: number,
  character: "a" | "b",
): Expression {
  if (lineIdx === 0) return character === "b" ? "excited" : "neutral";
  if (lineIdx === totalLines - 1) return character === "a" ? "skeptical" : "smug";
  const pool: Expression[] =
    character === "a"
      ? ["neutral", "skeptical", "neutral"]
      : ["excited", "smug", "excited"];
  return pool[lineIdx % pool.length];
}

function listenerExpression(lineIdx: number, listener: "a" | "b"): Expression {
  const reactions: Expression[] =
    listener === "a"
      ? ["skeptical", "neutral", "skeptical", "neutral"]
      : ["excited", "smug", "neutral", "excited"];
  return reactions[lineIdx % reactions.length];
}

export const VidifyVideo: React.FC<VideoProps> = ({ lines }) => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;

  const { idx, localT } = findActive(lines, t);
  const active = lines[idx];
  const totalLines = lines.length;

  // Mouth state
  const activeWord = active.wordTimestamps.find(
    (w) => localT >= w.start && localT <= w.end,
  );
  const speaking = !!activeWord;

  // Expressions
  const speakerExpr = expressionForLine(idx, totalLines, active.character);
  const listenerChar: "a" | "b" = active.character === "a" ? "b" : "a";
  const listenerExpr = listenerExpression(idx, listenerChar);

  // Audio sequence timing
  let cumulative = 0;
  const lineStarts = lines.map((line) => {
    const startFrame = Math.round(cumulative * fps);
    cumulative += line.durationSec;
    return startFrame;
  });

  return (
    <AbsoluteFill>
      {/* Colorful gradient background — changes per line */}
      <Background lineIdx={idx} />

      {/* Stick figures — small, centered at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 350,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: "scale(0.35)",
          transformOrigin: "center bottom",
        }}
      >
        <div style={{ position: "relative", width: 1080, height: 1400 }}>
          <StickFigure
            character="a"
            expression={active.character === "a" ? speakerExpr : listenerExpr}
            mouthOpen={active.character === "a" && speaking}
            posX={340}
          />
          <StickFigure
            character="b"
            expression={active.character === "b" ? speakerExpr : listenerExpr}
            mouthOpen={active.character === "b" && speaking}
            posX={740}
          />
        </div>
      </div>

      {/* Big meme-style captions */}
      <Caption
        words={active.wordTimestamps}
        localT={localT}
        character={active.character}
      />

      {/* Audio sequences */}
      {lines.map((line, i) => (
        <Sequence
          key={i}
          from={lineStarts[i]}
          durationInFrames={Math.round(line.durationSec * fps)}
          layout="none"
        >
          <Audio src={staticFile(line.audioFile)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export { FPS };
