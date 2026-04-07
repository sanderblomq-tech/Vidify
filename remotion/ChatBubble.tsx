import type { Sender } from "../src/types";

export type ChatBubbleProps = {
  text: string;
  sender: Sender;
  characterA: string;
  characterB: string;
  receipt?: "none" | "delivered" | "read";
};

/**
 * iOS iMessage-style chat bubble (dark mode).
 * Character A = left (dark gray, received), Character B = right (blue, sent).
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  text,
  sender,
  receipt = "none",
}) => {
  const isA = sender === "a";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isA ? "flex-start" : "flex-end",
        paddingLeft: 4,
        paddingRight: 4,
        marginBottom: 4,
      }}
    >
      {/* iMessage bubble — dark mode */}
      <div
        style={{
          maxWidth: "78%",
          padding: "14px 18px",
          borderRadius: 20,
          borderBottomLeftRadius: isA ? 4 : 20,
          borderBottomRightRadius: isA ? 20 : 4,
          backgroundColor: isA ? "#3A3A3C" : "#007AFF",
          color: "#fff",
          fontFamily:
            "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
          fontSize: 30,
          lineHeight: 1.3,
          letterSpacing: "-0.3px",
        }}
      >
        {text}
      </div>

      {/* Read receipt — only for Character B (sent messages) */}
      {!isA && receipt !== "none" && (
        <div
          style={{
            fontFamily:
              "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
            fontSize: 16,
            fontWeight: 400,
            color: receipt === "read" ? "#007AFF" : "#8E8E93",
            marginTop: 3,
            marginRight: 4,
            letterSpacing: "-0.2px",
          }}
        >
          {receipt === "read" ? "Read" : "Delivered"}
        </div>
      )}
    </div>
  );
};
