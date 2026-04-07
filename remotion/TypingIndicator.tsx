import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * iMessage-style typing indicator — three bouncing dots.
 * All animation driven by useCurrentFrame(), no CSS animations.
 */
export const TypingIndicator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const dots = [0, 1, 2];
  const cycleSpeed = 3; // cycles per second

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        paddingLeft: 4,
        paddingRight: 4,
        marginBottom: 4,
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderRadius: 20,
          borderBottomLeftRadius: 4,
          backgroundColor: "#3A3A3C",
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 22,
        }}
      >
        {dots.map((i) => {
          const phase = t * cycleSpeed * Math.PI * 2 + i * ((Math.PI * 2) / 3);
          const bounce = Math.sin(phase) * 0.5 + 0.5; // 0-1
          const y = -bounce * 6;
          const opacity = 0.4 + bounce * 0.6;

          return (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#8E8E93",
                opacity,
                transform: `translateY(${y}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
