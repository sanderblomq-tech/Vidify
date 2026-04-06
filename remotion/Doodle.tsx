/**
 * Whiteboard doodles — sketchy hand-drawn SVG props that appear
 * next to the speaking character when relevant to the dialog.
 */

type DoodleRenderer = () => React.ReactNode;

const S = "#222"; // stroke color
const SW = 6; // stroke width

const doodles: Record<string, DoodleRenderer> = {
  barbell: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" fill="none">
      {/* Bar */}
      <line x1={-120} y1={0} x2={120} y2={0} />
      {/* Left weight */}
      <rect x={-140} y={-45} width={30} height={90} rx={4} fill="#444" />
      <rect x={-160} y={-35} width={20} height={70} rx={3} fill="#555" />
      {/* Right weight */}
      <rect x={110} y={-45} width={30} height={90} rx={4} fill="#444" />
      <rect x={140} y={-35} width={20} height={70} rx={3} fill="#555" />
    </g>
  ),

  phone: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round">
      <rect x={-35} y={-55} width={70} height={110} rx={12} fill="#e8e8e8" />
      <rect x={-25} y={-40} width={50} height={70} rx={4} fill="#4af" />
      <circle cx={0} cy={42} r={6} fill="none" />
    </g>
  ),

  pizza: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
      <path d="M 0 -60 L -55 50 Q 0 70 55 50 Z" fill="#f4a21d" />
      <path d="M 0 -60 L -55 50 Q 0 70 55 50 Z" fill="none" />
      {/* Pepperoni */}
      <circle cx={-10} cy={-5} r={10} fill="#c33" />
      <circle cx={20} cy={20} r={8} fill="#c33" />
      <circle cx={-25} cy={25} r={9} fill="#c33" />
    </g>
  ),

  laptop: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
      {/* Screen */}
      <rect x={-65} y={-50} width={130} height={80} rx={6} fill="#333" />
      <rect x={-55} y={-42} width={110} height={64} rx={2} fill="#4af" />
      {/* Base */}
      <path d="M -75 30 L -65 30 L 65 30 L 75 30" fill="none" />
      <rect x={-75} y={30} width={150} height={12} rx={3} fill="#ccc" />
    </g>
  ),

  money: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round">
      {/* Bills */}
      <rect x={-50} y={-25} width={100} height={50} rx={4} fill="#6abf69" />
      <rect x={-40} y={-35} width={100} height={50} rx={4} fill="#82d480" />
      {/* Dollar sign */}
      <text
        x={10} y={-3}
        fontSize={36} fontWeight="bold" fill="#2d6a2e"
        textAnchor="middle" dominantBaseline="middle"
        stroke="none"
      >
        $
      </text>
    </g>
  ),

  bed: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
      {/* Mattress */}
      <rect x={-80} y={-15} width={160} height={45} rx={6} fill="#8bb4d9" />
      {/* Pillow */}
      <rect x={-75} y={-35} width={50} height={30} rx={12} fill="#fff" />
      {/* Headboard */}
      <rect x={-85} y={-55} width={15} height={85} rx={3} fill="#a07040" />
      {/* Legs */}
      <line x1={-75} y1={30} x2={-75} y2={45} />
      <line x1={75} y1={30} x2={75} y2={45} />
      {/* Z's */}
      <text x={30} y={-45} fontSize={28} fill="#666" stroke="none" fontWeight="bold">z</text>
      <text x={50} y={-65} fontSize={22} fill="#888" stroke="none" fontWeight="bold">z</text>
      <text x={65} y={-80} fontSize={16} fill="#aaa" stroke="none" fontWeight="bold">z</text>
    </g>
  ),

  controller: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
      {/* Body */}
      <path
        d="M -60 -10 Q -60 -35 -30 -35 L 30 -35 Q 60 -35 60 -10 L 55 25 Q 50 40 35 40 L 15 25 L -15 25 L -35 40 Q -50 40 -55 25 Z"
        fill="#555"
      />
      {/* D-pad */}
      <line x1={-30} y1={-5} x2={-30} y2={-20} />
      <line x1={-38} y1={-12} x2={-22} y2={-12} />
      {/* Buttons */}
      <circle cx={25} cy={-18} r={5} fill="#e63946" />
      <circle cx={35} cy={-8} r={5} fill="#2563eb" />
      {/* Sticks */}
      <circle cx={-15} cy={10} r={7} fill="#333" />
      <circle cx={20} cy={10} r={7} fill="#333" />
    </g>
  ),

  coffee: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
      {/* Cup */}
      <path d="M -35 -30 L -30 40 Q 0 55 30 40 L 35 -30 Z" fill="#fff" />
      {/* Handle */}
      <path d="M 35 -10 Q 55 -10 55 12 Q 55 30 35 30" fill="none" />
      {/* Steam */}
      <path d="M -10 -40 Q -5 -55 -10 -70" fill="none" strokeWidth={3} />
      <path d="M 5 -38 Q 10 -55 5 -68" fill="none" strokeWidth={3} />
      <path d="M 20 -42 Q 25 -55 20 -65" fill="none" strokeWidth={3} />
      {/* Coffee fill */}
      <path d="M -32 -15 L -30 40 Q 0 55 30 40 L 32 -15 Z" fill="#6b3e26" opacity={0.6} />
    </g>
  ),

  book: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
      {/* Cover */}
      <rect x={-45} y={-35} width={90} height={70} rx={4} fill="#e63946" />
      {/* Pages */}
      <rect x={-40} y={-30} width={80} height={60} rx={2} fill="#fff" />
      {/* Spine */}
      <line x1={-45} y1={-35} x2={-45} y2={35} strokeWidth={8} />
      {/* Text lines */}
      <line x1={-25} y1={-15} x2={25} y2={-15} strokeWidth={2} />
      <line x1={-25} y1={-2} x2={20} y2={-2} strokeWidth={2} />
      <line x1={-25} y1={11} x2={15} y2={11} strokeWidth={2} />
    </g>
  ),

  car: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
      {/* Body */}
      <path d="M -80 10 L -60 -25 L -20 -45 L 40 -45 L 70 -20 L 80 10 Z" fill="#e63946" />
      {/* Windshield */}
      <path d="M -15 -42 L -50 -22 L -20 -22 Z" fill="#aadcf0" />
      <path d="M -10 -42 L 35 -42 L 60 -22 L -15 -22 Z" fill="#aadcf0" />
      {/* Bottom */}
      <rect x={-85} y={10} width={170} height={18} rx={4} fill="#c33" />
      {/* Wheels */}
      <circle cx={-45} cy={30} r={16} fill="#333" />
      <circle cx={-45} cy={30} r={7} fill="#888" />
      <circle cx={50} cy={30} r={16} fill="#333" />
      <circle cx={50} cy={30} r={7} fill="#888" />
    </g>
  ),

  trophy: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
      {/* Cup */}
      <path d="M -35 -50 L -30 10 Q 0 30 30 10 L 35 -50 Z" fill="#f4a21d" />
      {/* Handles */}
      <path d="M -35 -35 Q -60 -35 -60 -10 Q -60 10 -35 5" fill="none" />
      <path d="M 35 -35 Q 60 -35 60 -10 Q 60 10 35 5" fill="none" />
      {/* Base */}
      <rect x={-10} y={15} width={20} height={20} rx={2} fill="#daa520" />
      <rect x={-30} y={35} width={60} height={10} rx={3} fill="#8b6914" />
      {/* Star */}
      <text
        x={0} y={-14}
        fontSize={28} fill="#fff"
        textAnchor="middle" dominantBaseline="middle"
        stroke="none"
      >
        ★
      </text>
    </g>
  ),

  skull: () => (
    <g stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
      {/* Cranium */}
      <ellipse cx={0} cy={-15} rx={45} ry={50} fill="#f5f0e8" />
      {/* Eyes */}
      <ellipse cx={-16} cy={-20} rx={12} ry={15} fill="#222" />
      <ellipse cx={16} cy={-20} rx={12} ry={15} fill="#222" />
      {/* Nose */}
      <path d="M -4 0 L 0 8 L 4 0" fill="#333" />
      {/* Jaw */}
      <path d="M -30 15 Q -25 40 0 40 Q 25 40 30 15" fill="#e8e0d5" />
      {/* Teeth */}
      <line x1={-12} y1={20} x2={-12} y2={30} strokeWidth={3} />
      <line x1={0} y1={20} x2={0} y2={32} strokeWidth={3} />
      <line x1={12} y1={20} x2={12} y2={30} strokeWidth={3} />
    </g>
  ),
};

type DoodleProps = {
  id: string;
  x: number;
  y: number;
  scale?: number;
};

export const Doodle: React.FC<DoodleProps> = ({ id, x, y, scale = 1 }) => {
  const render = doodles[id];
  if (!render) return null;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {render()}
    </g>
  );
};
