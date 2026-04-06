import type { Sender } from "../src/types";

export type ChatBubbleProps = {
  text: string;
  sender: Sender;
  characterA: string;
  characterB: string;
};

/** Character colors */
const COLORS: Record<Sender, string> = {
  a: "#5AC8FA",
  b: "#FF9500",
};

/** Strip emojis from name for the label */
function stripEmojis(str: string): string {
  return str.replace(/[\p{Emoji}\u200d\ufe0f]/gu, "").trim();
}

/**
 * Debate-style chat bubble with character name label and distinct colors.
 * Character A = left (blue), Character B = right (orange).
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  text,
  sender,
  characterA,
  characterB,
}) => {
  const isA = sender === "a";
  const color = COLORS[sender];
  const name = isA ? characterA : characterB;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isA ? "flex-start" : "flex-end",
        paddingLeft: 8,
        paddingRight: 8,
        marginBottom: 12,
      }}
    >
      {/* Name label */}
      <div
        style={{
          color,
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "-apple-system, sans-serif",
          marginBottom: 4,
          paddingLeft: isA ? 14 : 0,
          paddingRight: isA ? 0 : 14,
        }}
      >
        {stripEmojis(name)}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "78%",
          padding: "18px 24px",
          borderRadius: 28,
          borderBottomRightRadius: isA ? 28 : 6,
          borderBottomLeftRadius: isA ? 6 : 28,
          backgroundColor: isA ? "rgba(90, 200, 250, 0.2)" : "rgba(255, 149, 0, 0.2)",
          border: `2px solid ${color}40`,
          color: "#fff",
          fontFamily:
            "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
          fontSize: 34,
          lineHeight: 1.3,
          letterSpacing: "-0.2px",
        }}
      >
        {text}
      </div>
    </div>
  );
};
