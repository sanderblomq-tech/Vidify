import type { Sender } from "../src/types";

type ChatBubbleProps = {
  text: string;
  sender: Sender;
};

/**
 * Realistic iOS iMessage bubble — smaller and more authentic.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ text, sender }) => {
  const isMe = sender === "me";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        paddingLeft: 8,
        paddingRight: 8,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "18px 24px",
          borderRadius: 28,
          borderBottomRightRadius: isMe ? 6 : 28,
          borderBottomLeftRadius: isMe ? 28 : 6,
          backgroundColor: isMe ? "#007AFF" : "#3A3A3C",
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
