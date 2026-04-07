import { AbsoluteFill } from "remotion";

/**
 * Bold, colorful backgrounds that cycle per line.
 * Each line gets a different vibrant gradient — eye-catching for shorts.
 */

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f5576c 0%, #ff6a00 100%)",
  "linear-gradient(135deg, #0250c5 0%, #d43f8d 100%)",
];

type BackgroundProps = {
  lineIdx: number;
};

export const Background: React.FC<BackgroundProps> = ({ lineIdx }) => {
  const gradient = GRADIENTS[lineIdx % GRADIENTS.length];

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: gradient,
        }}
      />
    </AbsoluteFill>
  );
};

