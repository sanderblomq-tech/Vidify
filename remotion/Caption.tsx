import type { CharacterId } from "../src/types";

export type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

type Props = {
  words: WordTimestamp[];
  localT: number;
  character: CharacterId;
};

/**
 * Huge meme-style captions — one word at a time, white with black outline.
 * Centered in the upper portion of the frame for maximum visibility.
 */
export const Caption: React.FC<Props> = ({ words, localT }) => {
  const activeIdx = words.findIndex(
    (w) => localT >= w.start && localT <= w.end,
  );

  if (activeIdx === -1) return null;

  const active = words[activeIdx];
  const next = words[activeIdx + 1];
  const showTwo = next && active.word.length + next.word.length <= 8;
  const displayText = showTwo
    ? `${active.word} ${next.word}`
    : active.word;

  // Pop-in scale animation
  const age = Math.max(0, localT - active.start);
  const pop = Math.min(1, age / 0.08);
  const eased = 1 - Math.pow(1 - pop, 3);
  const scale = 1.15 - 0.15 * eased;

  return (
    <div
      style={{
        position: "absolute",
        left: 30,
        right: 30,
        top: 250,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily:
            "'Archivo Black', 'Anton', 'Impact', 'Helvetica Neue', sans-serif",
          fontSize: 200,
          fontWeight: 900,
          letterSpacing: "6px",
          textTransform: "uppercase",
          color: "#ffffff",
          WebkitTextStroke: "22px #000",
          paintOrder: "stroke fill",
          lineHeight: 1,
          textShadow: "0 8px 30px rgba(0,0,0,0.5)",
          textAlign: "center",
          maxWidth: "95%",
        }}
      >
        {displayText}
      </div>
    </div>
  );
};
