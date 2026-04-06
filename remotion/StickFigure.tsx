import { useCurrentFrame, useVideoConfig } from "remotion";
import type { CharacterId } from "../src/types";

export type Expression = "neutral" | "smug" | "excited" | "skeptical";

export type StickFigureProps = {
  character: CharacterId;
  expression: Expression;
  mouthOpen: boolean;
  posX?: number;
};

/**
 * Full-body stick figure with character-specific accessories.
 *
 * Character A (Blipp): Black hair with bangs, eyebrows
 * Character B (Zorp): Blue glasses, propeller cap
 *
 * Expression presets:
 *  neutral  — tall pill eyes, flat mouth
 *  smug     — arch eyes (upside-down U), slight smile
 *  excited  — tall oval eyes, big open mouth
 *  skeptical — flat narrow eyes, slight frown
 */
export const StickFigure: React.FC<StickFigureProps> = ({
  character,
  expression,
  mouthOpen,
  posX = 540,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cx = posX;
  const headY = 620;
  const headR = 380;

  // Animation drivers
  const talking = mouthOpen;
  const tiltAmp = talking ? 5 : 2;
  const tilt = Math.sin(t * Math.PI * 2.2) * tiltAmp;
  const bounce = talking ? Math.sin(t * Math.PI * 5.5) * 8 : 0;

  // Blink
  const blinkCycle = frame % Math.round(fps * 2.8);
  const blinking = blinkCycle < 4;

  const s = "#111";
  const sw = 14;
  const blush =
    character === "a" ? "rgba(160,120,220,0.7)" : "rgba(255,130,130,0.7)";

  // ── Eye geometry ──
  const eyeGap = 155;
  const lx = cx - eyeGap;
  const rx = cx + eyeGap;
  const eyeBaseY = headY - 80;

  const renderEyes = () => {
    if (blinking) {
      return (
        <>
          <line x1={lx - 55} y1={eyeBaseY} x2={lx + 55} y2={eyeBaseY}
            stroke={s} strokeWidth={16} strokeLinecap="round" />
          <line x1={rx - 55} y1={eyeBaseY} x2={rx + 55} y2={eyeBaseY}
            stroke={s} strokeWidth={16} strokeLinecap="round" />
        </>
      );
    }
    switch (expression) {
      case "smug":
        return (
          <>
            <path d={`M ${lx - 55} ${eyeBaseY + 20} Q ${lx} ${eyeBaseY - 70} ${lx + 55} ${eyeBaseY + 20}`}
              stroke={s} strokeWidth={16} strokeLinecap="round" fill="none" />
            <path d={`M ${rx - 55} ${eyeBaseY + 20} Q ${rx} ${eyeBaseY - 70} ${rx + 55} ${eyeBaseY + 20}`}
              stroke={s} strokeWidth={16} strokeLinecap="round" fill="none" />
          </>
        );
      case "skeptical":
        return (
          <>
            <rect x={lx - 60} y={eyeBaseY - 30} width={120} height={60}
              rx={12} ry={12} fill={s} />
            <rect x={rx - 60} y={eyeBaseY - 30} width={120} height={60}
              rx={12} ry={12} fill={s} />
          </>
        );
      case "excited":
        return (
          <>
            <ellipse cx={lx} cy={eyeBaseY} rx={60} ry={95} fill={s} />
            <ellipse cx={rx} cy={eyeBaseY} rx={60} ry={95} fill={s} />
          </>
        );
      default:
        return (
          <>
            <rect x={lx - 55} y={eyeBaseY - 75} width={110} height={150}
              rx={55} ry={55} fill={s} />
            <rect x={rx - 55} y={eyeBaseY - 75} width={110} height={150}
              rx={55} ry={55} fill={s} />
          </>
        );
    }
  };

  // ── Mouth ──
  const mouthY = headY + 190;
  const renderMouth = () => {
    if (mouthOpen) {
      const ry = expression === "excited" ? 100 : 70;
      const rx_m = expression === "excited" ? 65 : 55;
      return <ellipse cx={cx} cy={mouthY} rx={rx_m} ry={ry} fill={s} />;
    }
    switch (expression) {
      case "smug":
        return (
          <path d={`M ${cx - 45} ${mouthY - 5} Q ${cx} ${mouthY + 35} ${cx + 45} ${mouthY - 5}`}
            stroke={s} strokeWidth={12} strokeLinecap="round" fill="none" />
        );
      case "skeptical":
        return (
          <path d={`M ${cx - 40} ${mouthY + 8} Q ${cx} ${mouthY - 15} ${cx + 40} ${mouthY + 8}`}
            stroke={s} strokeWidth={12} strokeLinecap="round" fill="none" />
        );
      default:
        return (
          <line x1={cx - 45} y1={mouthY} x2={cx + 45} y2={mouthY}
            stroke={s} strokeWidth={12} strokeLinecap="round" />
        );
    }
  };

  // ── Eyebrows (character A only) ──
  const renderEyebrows = () => {
    if (character !== "a") return null;
    const browY = eyeBaseY - 115;
    const browAngle = expression === "skeptical" ? 8 : expression === "excited" ? -5 : 0;
    return (
      <>
        <line
          x1={lx - 50} y1={browY + browAngle}
          x2={lx + 50} y2={browY - browAngle}
          stroke={s} strokeWidth={14} strokeLinecap="round"
        />
        <line
          x1={rx - 50} y1={browY - browAngle}
          x2={rx + 50} y2={browY + browAngle}
          stroke={s} strokeWidth={14} strokeLinecap="round"
        />
      </>
    );
  };

  // ── Body geometry ──
  const neckTop = headY + headR;
  const shoulderY = neckTop + 80;
  const hipY = shoulderY + 280;
  const armLength = 200;
  const armWave = talking
    ? Math.sin(t * Math.PI * 4) * 35
    : Math.sin(t * Math.PI * 0.7) * 8;
  const legSpread = 100;
  const legLength = 280;

  // ── Character A accessories: black hair with bangs ──
  const renderHairA = () => (
    <g>
      {/* Hair volume on top */}
      <path
        d={`M ${cx - headR + 40} ${headY - 50}
            Q ${cx - headR - 30} ${headY - headR - 60} ${cx - 80} ${headY - headR - 80}
            Q ${cx} ${headY - headR - 110} ${cx + 80} ${headY - headR - 80}
            Q ${cx + headR + 30} ${headY - headR - 60} ${cx + headR - 40} ${headY - 50}`}
        fill="#222" stroke="#111" strokeWidth={6}
      />
      {/* Bangs across forehead */}
      <path
        d={`M ${cx - 250} ${headY - headR + 100}
            Q ${cx - 180} ${headY - headR - 20} ${cx - 100} ${headY - headR + 60}
            Q ${cx - 20} ${headY - headR - 10} ${cx + 60} ${headY - headR + 50}
            Q ${cx + 140} ${headY - headR - 20} ${cx + 200} ${headY - headR + 90}
            L ${cx + headR - 20} ${headY - headR + 60}
            Q ${cx + headR + 10} ${headY - headR - 40} ${cx + headR - 40} ${headY - 120}
            L ${cx + headR - 40} ${headY - 50}
            L ${cx - headR + 40} ${headY - 50}
            L ${cx - headR + 20} ${headY - 120}
            Q ${cx - headR - 10} ${headY - headR - 40} ${cx - 250} ${headY - headR + 100}`}
        fill="#222" stroke="#111" strokeWidth={4}
      />
    </g>
  );

  // ── Character B accessories: blue glasses + propeller cap ──
  const renderGlassesB = () => {
    const glassY = eyeBaseY;
    const glassW = 140;
    const glassH = 120;
    return (
      <g>
        {/* Left lens */}
        <rect
          x={lx - glassW / 2} y={glassY - glassH / 2}
          width={glassW} height={glassH}
          rx={20} ry={20}
          fill="rgba(0,0,0,0.35)" stroke="#2563eb" strokeWidth={12}
        />
        {/* Right lens */}
        <rect
          x={rx - glassW / 2} y={glassY - glassH / 2}
          width={glassW} height={glassH}
          rx={20} ry={20}
          fill="rgba(0,0,0,0.35)" stroke="#2563eb" strokeWidth={12}
        />
        {/* Bridge */}
        <line
          x1={lx + glassW / 2} y1={glassY}
          x2={rx - glassW / 2} y2={glassY}
          stroke="#2563eb" strokeWidth={10}
        />
        {/* Temple arms */}
        <line
          x1={lx - glassW / 2} y1={glassY - 10}
          x2={cx - headR + 30} y2={glassY - 30}
          stroke="#2563eb" strokeWidth={8}
        />
        <line
          x1={rx + glassW / 2} y1={glassY - 10}
          x2={cx + headR - 30} y2={glassY - 30}
          stroke="#2563eb" strokeWidth={8}
        />
      </g>
    );
  };

  const renderCapB = () => {
    const capY = headY - headR;
    const propellerSpin = (t * 360 * 3) % 360; // 3 rotations per second
    return (
      <g>
        {/* Cap body - multicolor panels */}
        <path
          d={`M ${cx - 260} ${capY + 80}
              Q ${cx - 260} ${capY - 60} ${cx} ${capY - 80}
              Q ${cx + 260} ${capY - 60} ${cx + 260} ${capY + 80}
              Z`}
          fill="#e63946" stroke="#111" strokeWidth={6}
        />
        {/* Yellow panel */}
        <path
          d={`M ${cx - 260} ${capY + 80}
              Q ${cx - 260} ${capY - 60} ${cx - 80} ${capY - 75}
              L ${cx} ${capY + 80} Z`}
          fill="#f4a21d"
        />
        {/* Green panel */}
        <path
          d={`M ${cx + 80} ${capY - 75}
              Q ${cx + 260} ${capY - 60} ${cx + 260} ${capY + 80}
              L ${cx} ${capY + 80} Z`}
          fill="#2d936c"
        />
        {/* Blue panel */}
        <path
          d={`M ${cx - 80} ${capY - 75}
              Q ${cx} ${capY - 90} ${cx + 80} ${capY - 75}
              L ${cx} ${capY + 80} Z`}
          fill="#2563eb"
        />
        {/* Brim */}
        <ellipse cx={cx} cy={capY + 80} rx={280} ry={30} fill="#333" stroke="#111" strokeWidth={4} />

        {/* Propeller */}
        <g transform={`rotate(${propellerSpin} ${cx} ${capY - 80})`}>
          {/* Blades */}
          <ellipse cx={cx - 60} cy={capY - 85} rx={70} ry={12} fill="#2563eb" stroke="#111" strokeWidth={3} />
          <ellipse cx={cx + 60} cy={capY - 75} rx={70} ry={12} fill="#e63946" stroke="#111" strokeWidth={3}
            transform={`rotate(90, ${cx + 60}, ${capY - 75})`} />
        </g>
        {/* Propeller hub */}
        <circle cx={cx} cy={capY - 80} r={12} fill="#f4a21d" stroke="#111" strokeWidth={3} />
      </g>
    );
  };

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920"
      style={{ position: "absolute", top: 0, left: 0 }}>

      <g transform={`translate(0, ${bounce})`}>
        {/* ── BODY (behind head) ── */}
        <g stroke={s} strokeWidth={18} strokeLinecap="round" fill="none">
          {/* Neck */}
          <line x1={cx} y1={neckTop - 10} x2={cx} y2={shoulderY} />
          {/* Torso */}
          <line x1={cx} y1={shoulderY} x2={cx} y2={hipY} />
          {/* Left arm */}
          <line x1={cx} y1={shoulderY}
            x2={cx - armLength} y2={shoulderY + 120 + armWave} />
          {/* Right arm */}
          <line x1={cx} y1={shoulderY}
            x2={cx + armLength} y2={shoulderY + 120 - armWave} />
          {/* Left leg */}
          <line x1={cx} y1={hipY}
            x2={cx - legSpread} y2={hipY + legLength} />
          {/* Right leg */}
          <line x1={cx} y1={hipY}
            x2={cx + legSpread} y2={hipY + legLength} />
        </g>

        {/* ── HEAD GROUP (rotates for tilt) ── */}
        <g transform={`rotate(${tilt} ${cx} ${headY})`}>
          {/* Drop shadow */}
          <ellipse cx={cx} cy={headY + headR + 15} rx={headR * 0.7}
            ry={18} fill="rgba(0,0,0,0.15)" />

          {/* Head circle */}
          <circle cx={cx} cy={headY} r={headR}
            fill="#fff" stroke={s} strokeWidth={sw} />

          {/* Blush */}
          <ellipse cx={cx - 160} cy={headY + 80} rx={95} ry={36} fill={blush} />
          <ellipse cx={cx + 160} cy={headY + 80} rx={95} ry={36} fill={blush} />

          {/* Eyes */}
          {renderEyes()}

          {/* Eyebrows (character A) */}
          {renderEyebrows()}

          {/* Mouth */}
          {renderMouth()}

          {/* Character A: Hair */}
          {character === "a" && renderHairA()}

          {/* Character B: Glasses */}
          {character === "b" && renderGlassesB()}

          {/* Character B: Propeller cap */}
          {character === "b" && renderCapB()}
        </g>
      </g>
    </svg>
  );
};
