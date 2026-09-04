import { motion } from 'framer-motion';

/**
 * The cabin from the driver's seat, drawn as line art, with the Flow Series
 * strips laid along the surfaces they actually follow on a real install: the
 * seam under the dash top, the door-card trims, the footwells.
 *
 * Everything is one SVG (800x450). The strips are stroked paths with a blurred
 * twin underneath for the glow; the tracer is a short bright segment of the
 * same dash path, pushed along it with pathOffset. In "Flow" mode the strips
 * take a scrolling spectrum gradient (SMIL on the gradient transform — no JS
 * per frame), which is what the controller's colour-cycle actually looks like.
 */

const DASH = 'M40 198 C190 182 610 182 760 198';
const DOOR_L = 'M30 208 L2 236';
const DOOR_R = 'M770 208 L798 236';
const DOOR_L_LOW = 'M0 322 L74 292';
const DOOR_R_LOW = 'M800 322 L726 292';

const LINE = 'rgb(255 255 255 / 0.13)';
const LINE_SOFT = 'rgb(255 255 255 / 0.07)';
const LINE_STRONG = 'rgb(255 255 255 / 0.2)';

export default function CabinDrawing({ color, isFlow, id, reduced }) {
  const stroke = isFlow ? 'url(#flow-spectrum)' : color;
  const pool = isFlow ? 'rgb(255 255 255)' : color;

  // Power-on: dash first, then doors, then footwells — the order a controller
  // brings zones up. Restarted by the `key` on every swatch tap.
  const on = (delay) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0.15 },
          animate: { opacity: 1 },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
        };

  return (
    <svg
      viewBox="0 0 800 450"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flow-spectrum" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0">
          {['#ff2d55', '#ff9f0a', '#30d158', '#0a84ff', '#bf5af2', '#ff2d55', '#ff9f0a', '#30d158', '#0a84ff', '#bf5af2', '#ff2d55'].map(
            (c, i) => (
              <stop key={i} offset={i / 10} stopColor={c} />
            ),
          )}
          {!reduced && (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="0 0"
              to="-800 0"
              dur="9s"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>
        <filter id="strip-glow" x="-10%" y="-400%" width="120%" height="900%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="pool-blur" x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <linearGradient id="glass-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.045" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dash-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.015" />
        </linearGradient>
      </defs>

      {/* ---- Structure ---- */}
      {/* Windshield */}
      <polygon points="96,28 704,28 772,178 28,178" fill="url(#glass-sky)" stroke={LINE} strokeWidth="1" />
      {/* Header / roofline */}
      <path d="M60 28 C300 18 500 18 740 28" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
      {/* A-pillars */}
      <path d="M96 28 L28 178 M704 28 L772 178" fill="none" stroke={LINE_STRONG} strokeWidth="2.5" strokeLinecap="round" />
      {/* Rear-view mirror */}
      <rect x="360" y="34" width="80" height="22" rx="6" fill="rgb(255 255 255 / 0.06)" stroke={LINE} strokeWidth="1" />
      <path d="M400 34 L400 26" stroke={LINE} strokeWidth="1.5" />

      {/* Dash top surface */}
      <path d="M28 178 C180 160 620 160 772 178 L800 240 C600 218 200 218 0 240 Z" fill="url(#dash-top)" stroke="none" />
      <path d="M28 178 C180 160 620 160 772 178" fill="none" stroke={LINE_STRONG} strokeWidth="1.5" />
      {/* Dash front lip and lower edge */}
      <path d="M0 240 C200 218 600 218 800 240" fill="none" stroke={LINE} strokeWidth="1" />
      <path d="M0 262 C200 244 600 244 800 262" fill="none" stroke={LINE_SOFT} strokeWidth="1" />

      {/* Instrument binnacle */}
      <path d="M150 176 C158 128 332 128 340 176" fill="rgb(255 255 255 / 0.03)" stroke={LINE} strokeWidth="1" />
      <rect x="176" y="146" width="138" height="24" rx="5" fill="rgb(255 255 255 / 0.04)" stroke={LINE_SOFT} strokeWidth="1" />
      <circle cx="214" cy="158" r="7" fill="none" stroke={LINE} strokeWidth="1" />
      <circle cx="276" cy="158" r="7" fill="none" stroke={LINE} strokeWidth="1" />

      {/* Centre screen + vents */}
      <rect x="352" y="186" width="96" height="56" rx="6" fill="rgb(255 255 255 / 0.035)" stroke={LINE} strokeWidth="1" />
      <rect x="300" y="196" width="34" height="12" rx="3" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
      <rect x="466" y="196" width="34" height="12" rx="3" fill="none" stroke={LINE_SOFT} strokeWidth="1" />

      {/* Centre console */}
      <polygon points="356,262 444,262 474,450 326,450" fill="rgb(255 255 255 / 0.02)" stroke={LINE} strokeWidth="1" />
      <circle cx="400" cy="330" r="11" fill="rgb(255 255 255 / 0.06)" stroke={LINE} strokeWidth="1" />
      <circle cx="386" cy="394" r="9" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
      <circle cx="414" cy="394" r="9" fill="none" stroke={LINE_SOFT} strokeWidth="1" />

      {/* Steering wheel */}
      <path d="M128 329 A125 125 0 0 1 362 329" fill="none" stroke="rgb(255 255 255 / 0.16)" strokeWidth="14" strokeLinecap="round" />
      <path d="M128 329 A125 125 0 0 1 362 329" fill="none" stroke={LINE_STRONG} strokeWidth="1" />
      <rect x="214" y="350" width="62" height="44" rx="10" fill="rgb(255 255 255 / 0.05)" stroke={LINE} strokeWidth="1" />
      <path d="M214 372 L138 340 M276 372 L352 340" stroke={LINE} strokeWidth="6" strokeLinecap="round" />

      {/* Door cards */}
      <path d="M28 178 L0 214 M0 214 L0 450 M0 300 L72 270 M0 322 L74 292" fill="none" stroke={LINE} strokeWidth="1" />
      <path d="M772 178 L800 214 M800 300 L728 270 M800 322 L726 292" fill="none" stroke={LINE} strokeWidth="1" />
      <ellipse cx="44" cy="284" rx="12" ry="5" fill="none" stroke={LINE_SOFT} strokeWidth="1" transform="rotate(-22 44 284)" />
      <ellipse cx="756" cy="284" rx="12" ry="5" fill="none" stroke={LINE_SOFT} strokeWidth="1" transform="rotate(22 756 284)" />

      {/* ---- Light ---- */}
      {/* Footwells: last to catch */}
      <motion.ellipse key={`pl-${id}`} cx="150" cy="446" rx="96" ry="30" fill={pool} fillOpacity="0.5" filter="url(#pool-blur)" {...on(0.9)} />
      <motion.ellipse key={`pr-${id}`} cx="650" cy="446" rx="96" ry="30" fill={pool} fillOpacity="0.5" filter="url(#pool-blur)" {...on(0.9)} />

      {/* Doors */}
      {[DOOR_L, DOOR_R, DOOR_L_LOW, DOOR_R_LOW].map((d, i) => (
        <g key={`door-${i}-${id}`}>
          <motion.path d={d} fill="none" stroke={stroke} strokeWidth="9" strokeLinecap="round" strokeOpacity="0.55" filter="url(#strip-glow)" {...on(0.55)} />
          <motion.path d={d} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" {...on(0.55)} />
        </g>
      ))}

      {/* Dash: the long run, first to catch */}
      <motion.path key={`dg-${id}`} d={DASH} fill="none" stroke={stroke} strokeWidth="11" strokeLinecap="round" strokeOpacity="0.55" filter="url(#strip-glow)" {...on(0)} />
      <motion.path key={`ds-${id}`} d={DASH} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" {...on(0)} />

      {/* Tracer: a bright head that runs the new colour down the dash */}
      {!reduced && (
        <motion.path
          key={`tr-${id}`}
          d={DASH}
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ mixBlendMode: 'screen' }}
          initial={{ pathLength: 0.12, pathOffset: 0, opacity: 0 }}
          animate={{ pathOffset: 0.88, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.05, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
    </svg>
  );
}
