import type { CharacterId } from "../src/types";

/**
 * Hard-cut camera that alternates between close-ups on the speaker
 * and occasional two-shots showing both characters.
 *
 * Close-up: zoom 1.3-1.5 — shows full head + some body
 * Two-shot: zoom 1.0 — shows both characters
 */

export type Shot = {
  focusX: number;
  focusY: number;
  zoom: number;
  rotate: number;
};

const HEAD_Y = 620;

/** Rotation pool — subtle tilts for energy */
const ROTATIONS = [-0.8, 0.6, -0.5, 1.0, -0.6, 0.8, -1, 0.5];

/** Close-up zoom pool */
const CLOSE_ZOOMS = [1.12, 1.15, 1.1, 1.18, 1.12, 1.2, 1.1, 1.15];

/** Every Nth line is a two-shot */
const TWO_SHOT_EVERY = 3;

export function getShotForLine(
  lineIdx: number,
  _character: CharacterId,
  characterPosX: number,
): Shot {
  const isTwoShot = lineIdx % TWO_SHOT_EVERY === 0 && lineIdx > 0;

  if (isTwoShot) {
    return {
      focusX: 540, // center of frame
      focusY: HEAD_Y,
      zoom: 1.0,
      rotate: ROTATIONS[lineIdx % ROTATIONS.length] * 0.5,
    };
  }

  return {
    focusX: characterPosX,
    focusY: HEAD_Y,
    zoom: CLOSE_ZOOMS[lineIdx % CLOSE_ZOOMS.length],
    rotate: ROTATIONS[lineIdx % ROTATIONS.length],
  };
}

type CameraProps = {
  children: React.ReactNode;
  shot: Shot;
};

/** Viewport center — 1080x1920 frame */
const VCX = 540;
const VCY = 780;

export const Camera: React.FC<CameraProps> = ({ children, shot }) => {
  const { focusX, focusY, zoom, rotate } = shot;

  // "Zoom to point" transform:
  // 1. Move focus to origin  2. Scale + rotate  3. Move to viewport center
  const transform = [
    `translate(${VCX}px, ${VCY}px)`,
    `scale(${zoom})`,
    `rotate(${rotate}deg)`,
    `translate(${-focusX}px, ${-focusY}px)`,
  ].join(" ");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: "0 0",
        transform,
      }}
    >
      {children}
    </div>
  );
};
