import { motion } from 'framer-motion';

/**
 * The cabin from the driver's seat, drawn like an interior rendering rather
 * than a wireframe: one vanishing point (400,118), surfaces with tone, and the
 * furniture a real dashboard has — hooded cluster with gauges, bezelled
 * screen, slatted vents, climate knobs, a console with shifter, boot, switch
 * bank, cupholders and armrest, a wheel with a rim of real thickness, three
 * spokes, airbag hub, stalks and column, door cards with armrests, pulls,
 * window switches and speakers, pedals in the driver's footwell.
 *
 * The Flow Series strips run along the surfaces they follow on a real install:
 * the seam where the dash top meets its face, the door trims above the
 * armrests, and the footwells. The tracer is a short bright segment of the
 * dash path pushed along it with pathOffset. "Flow" mode uses a scrolling
 * spectrum gradient driven by SMIL — no JS per frame.
 *
 * viewBox 800x450. Left-hand drive.
 */

const DASH = 'M32 208 C200 192 600 192 768 208';
const DOOR_L_UP = 'M36 184 L2 220';
const DOOR_R_UP = 'M764 184 L798 220';
const DOOR_L_LOW = 'M0 288 L74 256';
const DOOR_R_LOW = 'M800 288 L726 256';

// Tone system — everything is white over black, so opacity is the palette.
const W = (a) => `rgb(255 255 255 / ${a})`;
const LINE = W(0.14);
const LINE_SOFT = W(0.07);
const LINE_STRONG = W(0.24);
const FILL_1 = W(0.025);
const FILL_2 = W(0.045);
const FILL_3 = W(0.07);

export default function CabinDrawing({ color, isFlow, id, reduced }) {
  const stroke = isFlow ? 'url(#flow-spectrum)' : color;
  const pool = isFlow ? '#ffffff' : color;

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
            <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="-800 0" dur="9s" repeatCount="indefinite" />
          )}
        </linearGradient>
        <filter id="strip-glow" x="-10%" y="-400%" width="120%" height="900%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="pool-blur" x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>

        {/* Surfaces */}
        <linearGradient id="g-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.055" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="g-dash-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.085" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="g-dash-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.045" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.005" />
        </linearGradient>
        <linearGradient id="g-console" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.035" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.07" />
        </linearGradient>
        <linearGradient id="g-hood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.09" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="g-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="g-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fb4ff" stopOpacity="0.07" />
          <stop offset="1" stopColor="#9fb4ff" stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id="g-speaker" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.01" />
        </radialGradient>
        <pattern id="p-speaker" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.9" fill={W(0.16)} />
        </pattern>
        <pattern id="p-slats" width="20" height="4.5" patternUnits="userSpaceOnUse">
          <rect width="20" height="1" y="1.6" fill={W(0.18)} />
        </pattern>
      </defs>

      {/* ============ Windshield, header, pillars ============ */}
      <polygon points="110,26 690,26 760,170 40,170" fill="url(#g-glass)" />
      {/* Reflection band */}
      <polygon points="140,26 320,26 220,170 60,170" fill="#fff" fillOpacity="0.012" />
      <path d="M40 170 C200 158 600 158 760 170" fill="none" stroke={LINE_STRONG} strokeWidth="1.5" />
      {/* Header trim */}
      <path d="M92 26 L708 26" stroke={LINE} strokeWidth="1" />
      <path d="M100 14 C300 4 500 4 700 14" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
      {/* Sun visors */}
      <path d="M124 27 L272 27 L266 48 Q262 52 256 52 L134 52 Q128 52 126 46 Z" fill={FILL_2} stroke={LINE} strokeWidth="1" />
      <path d="M528 27 L676 27 L674 46 Q672 52 666 52 L544 52 Q538 52 534 48 Z" fill={FILL_2} stroke={LINE} strokeWidth="1" />
      {/* A-pillars, with width */}
      <polygon points="110,26 122,26 52,170 40,170" fill={FILL_2} stroke={LINE_STRONG} strokeWidth="1" />
      <polygon points="690,26 678,26 748,170 760,170" fill={FILL_2} stroke={LINE_STRONG} strokeWidth="1" />
      {/* Rear-view mirror */}
      <path d="M400 14 L400 30" stroke={LINE} strokeWidth="2" />
      <rect x="352" y="30" width="96" height="28" rx="7" fill={FILL_3} stroke={LINE_STRONG} strokeWidth="1" />
      <rect x="358" y="35" width="84" height="18" rx="4" fill="#fff" fillOpacity="0.03" />

      {/* ============ Dash ============ */}
      {/* Top surface: cowl to leading edge */}
      <path d="M40 170 C200 158 600 158 760 170 L776 198 C600 184 200 184 24 198 Z" fill="url(#g-dash-top)" />
      {/* Leading edge — the seam the ambient strip follows */}
      <path d="M24 198 C200 184 600 184 776 198" fill="none" stroke={LINE_STRONG} strokeWidth="1.5" />
      {/* Face */}
      <path d="M24 198 C200 184 600 184 776 198 L800 268 C600 250 200 250 0 268 Z" fill="url(#g-dash-face)" />
      <path d="M0 268 C200 250 600 250 800 268" fill="none" stroke={LINE} strokeWidth="1" />
      {/* Knee bolsters / lower dash */}
      <path d="M0 268 C200 250 600 250 800 268 L800 300 C600 286 200 286 0 300 Z" fill="#fff" fillOpacity="0.012" />
      <path d="M0 300 C200 286 600 286 800 300" fill="none" stroke={LINE_SOFT} strokeWidth="1" />

      {/* ============ Instrument binnacle ============ */}
      {/* Hood — a shell that stands proud of the dash and shades the cluster */}
      <path d="M142 196 C148 128 352 128 358 196 Z" fill="url(#g-hood)" stroke={LINE_STRONG} strokeWidth="1.2" />
      <path d="M152 194 C160 140 340 140 348 194" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
      {/* Cluster face, recessed */}
      <path d="M166 194 C170 150 330 150 334 194 Z" fill="#000" fillOpacity="0.55" />
      {/* Gauges */}
      {[
        [212, 166],
        [288, 166],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="22" fill={FILL_1} stroke={LINE_STRONG} strokeWidth="1" />
          <circle cx={cx} cy={cy} r="19" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
          {Array.from({ length: 9 }, (_, k) => {
            const a = Math.PI * (0.75 + (k / 8) * 1.5);
            const x1 = cx + Math.cos(a) * 19;
            const y1 = cy + Math.sin(a) * 19;
            const x2 = cx + Math.cos(a) * (k % 2 ? 15.5 : 13.5);
            const y2 = cy + Math.sin(a) * (k % 2 ? 15.5 : 13.5);
            return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={W(k % 2 ? 0.16 : 0.3)} strokeWidth="1" />;
          })}
          {/* Needle */}
          {(() => {
            const a = Math.PI * (i === 0 ? 1.12 : 1.4);
            return (
              <line
                x1={cx - Math.cos(a) * 4}
                y1={cy - Math.sin(a) * 4}
                x2={cx + Math.cos(a) * 17}
                y2={cy + Math.sin(a) * 17}
                stroke={W(0.6)}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })()}
          <circle cx={cx} cy={cy} r="2.5" fill={W(0.5)} />
        </g>
      ))}
      {/* Info display between the dials */}
      <rect x="240" y="170" width="20" height="14" rx="2" fill={W(0.04)} stroke={LINE_SOFT} strokeWidth="1" />

      {/* ============ Centre stack ============ */}
      {/* Centre stack panel: a vertical surface hung under the dash seam */}
      <path d="M318 206 L482 206 L490 330 L310 330 Z" fill="#fff" fillOpacity="0.02" stroke={LINE_SOFT} strokeWidth="1" />
      {/* Vents with slats */}
      {[268, 482].map((x) => (
        <g key={x}>
          <rect x={x} y="218" width="50" height="22" rx="5" fill={FILL_1} stroke={LINE} strokeWidth="1" />
          <rect x={x + 5} y="222" width="40" height="14" fill="url(#p-slats)" />
        </g>
      ))}
      {/* Screen: bezel, glass, faint UI */}
      <rect x="326" y="212" width="148" height="68" rx="9" fill={FILL_3} stroke={LINE_STRONG} strokeWidth="1.2" />
      <rect x="334" y="219" width="132" height="54" rx="5" fill="url(#g-screen)" stroke={W(0.1)} strokeWidth="1" />
      <rect x="334" y="219" width="132" height="10" rx="5" fill="#fff" fillOpacity="0.05" />
      <circle cx="343" cy="224" r="2.2" fill={W(0.3)} />
      <rect x="352" y="221.5" width="46" height="5" rx="2.5" fill={W(0.14)} />
      <rect x="340" y="234" width="58" height="34" rx="4" fill={W(0.035)} stroke={LINE_SOFT} strokeWidth="1" />
      <path d="M346 262 C356 250 366 256 374 244 C380 238 388 242 394 238" fill="none" stroke={W(0.35)} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="394" cy="238" r="2.5" fill={W(0.5)} />
      <rect x="404" y="234" width="56" height="15" rx="4" fill={W(0.035)} stroke={LINE_SOFT} strokeWidth="1" />
      <rect x="404" y="253" width="56" height="15" rx="4" fill={W(0.035)} stroke={LINE_SOFT} strokeWidth="1" />
      <rect x="410" y="240" width="30" height="3" rx="1.5" fill={W(0.16)} />
      <rect x="410" y="259" width="22" height="3" rx="1.5" fill={W(0.16)} />
      {/* Hazard */}
      <rect x="390" y="285" width="20" height="9" rx="2" fill={FILL_2} stroke={LINE} strokeWidth="1" />
      <path d="M400 287 L396 292 L404 292 Z" fill="none" stroke={W(0.35)} strokeWidth="1" />
      {/* Climate row: two knobs with ticks, a bank of buttons between */}
      {[346, 454].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="309" r="13" fill={FILL_2} stroke={LINE_STRONG} strokeWidth="1" />
          <circle cx={cx} cy="309" r="9" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2;
            return (
              <line
                key={k}
                x1={cx + Math.cos(a) * 11}
                y1={309 + Math.sin(a) * 11}
                x2={cx + Math.cos(a) * 13}
                y2={309 + Math.sin(a) * 13}
                stroke={W(0.2)}
                strokeWidth="1"
              />
            );
          })}
          <line x1={cx} y1="309" x2={cx + 6} y2="302" stroke={W(0.45)} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
      {[366, 384, 402, 420].map((x) => (
        <rect key={x} x={x} y="302" width="14" height="14" rx="3" fill={FILL_2} stroke={LINE} strokeWidth="1" />
      ))}

      {/* ============ Centre console ============ */}
      {/* Side walls (darker) then top (lighter), edges converge on the VP */}
      <polygon points="358,330 318,450 332,450 366,330" fill="#fff" fillOpacity="0.02" />
      <polygon points="442,330 482,450 468,450 434,330" fill="#fff" fillOpacity="0.02" />
      <polygon points="366,330 434,330 468,450 332,450" fill="url(#g-console)" />
      <path d="M366 330 L332 450 M434 330 L468 450" fill="none" stroke={LINE_STRONG} strokeWidth="1.2" />
      <path d="M358 330 L318 450 M442 330 L482 450" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
      <path d="M358 330 L442 330" stroke={LINE} strokeWidth="1" />
      {/* Switch bank left of the shifter */}
      {[344, 358, 372].map((y, k) => (
        <rect key={y} x={378 - k * 1.5} y={y} width="16" height="10" rx="2.5" fill={FILL_2} stroke={LINE} strokeWidth="1" />
      ))}
      {/* Shifter: boot, lever, knob */}
      <ellipse cx="404" cy="378" rx="18" ry="9" fill={FILL_3} stroke={LINE_STRONG} strokeWidth="1" />
      <path d="M394 378 C398 372 410 372 414 378" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
      <line x1="404" y1="377" x2="404" y2="350" stroke={W(0.32)} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="404" cy="346" rx="9" ry="7" fill={W(0.16)} stroke={LINE_STRONG} strokeWidth="1" />
      <ellipse cx="402" cy="344" rx="4" ry="2.5" fill={W(0.14)} />
      {/* Cupholders with rims */}
      {[384, 418].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="412" rx="14" ry="12" fill="#000" fillOpacity="0.5" stroke={LINE_STRONG} strokeWidth="1" />
          <ellipse cx={cx} cy="412" rx="10" ry="8.5" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
          <ellipse cx={cx} cy="414" rx="6" ry="4.5" fill={W(0.03)} />
        </g>
      ))}
      {/* Armrest lid, cropped by the frame */}
      <rect x="336" y="434" width="134" height="60" rx="14" fill={FILL_3} stroke={LINE_STRONG} strokeWidth="1.2" />
      <path d="M348 446 L458 446" stroke={LINE} strokeWidth="1" />
      <rect x="394" y="438" width="18" height="5" rx="2.5" fill={W(0.12)} />

      {/* ============ Door cards ============ */}
      {[false, true].map((mirror) => {
        const X = (x) => (mirror ? 800 - x : x);
        return (
          <g key={mirror ? 'r' : 'l'}>
            {/* Window sill and card face */}
            <polygon points={`${X(40)},172 ${X(0)},206 ${X(0)},450 ${X(84)},450 ${X(84)},420`} fill="#fff" fillOpacity="0.015" />
            <path d={`M${X(40)} 172 L${X(0)} 206`} stroke={LINE_STRONG} strokeWidth="1.5" />
            {/* Trim line under the sill (the ambient strip runs here) */}
            <path d={`M${X(36)} 186 L${X(0)} 222`} stroke={LINE_SOFT} strokeWidth="1" />
            {/* Armrest block */}
            <polygon points={`${X(0)},296 ${X(74)},264 ${X(78)},276 ${X(0)},310`} fill={FILL_3} stroke={LINE_STRONG} strokeWidth="1" />
            <polygon points={`${X(0)},310 ${X(78)},276 ${X(78)},286 ${X(0)},322`} fill="#fff" fillOpacity="0.02" stroke={LINE_SOFT} strokeWidth="1" />
            {/* Window switches on the armrest */}
            {[0, 1].map((k) => (
              <rect
                key={k}
                x={X(24 + k * 14) - (mirror ? 9 : 0)}
                y={286 - k * 6}
                width="9"
                height="5"
                rx="1.5"
                fill={W(0.16)}
                transform={`rotate(${mirror ? 23 : -23} ${X(28 + k * 14)} ${288 - k * 6})`}
              />
            ))}
            {/* Door pull */}
            <ellipse cx={X(52)} cy="252" rx="13" ry="5" fill="#000" fillOpacity="0.5" stroke={LINE} strokeWidth="1" transform={`rotate(${mirror ? 23 : -23} ${X(52)} 252)`} />
            {/* Speaker */}
            <circle cx={X(30)} cy="374" r="24" fill="url(#g-speaker)" stroke={LINE} strokeWidth="1" />
            <circle cx={X(30)} cy="374" r="19" fill="url(#p-speaker)" />
            <circle cx={X(30)} cy="374" r="5" fill="none" stroke={LINE_SOFT} strokeWidth="1" />
          </g>
        );
      })}

      {/* ============ Steering wheel, stalks, column ============ */}
      {/* Stalks behind the wheel */}
      <path d="M150 334 L110 322" stroke={W(0.22)} strokeWidth="6" strokeLinecap="round" />
      <path d="M350 334 L390 322" stroke={W(0.22)} strokeWidth="6" strokeLinecap="round" />
      {/* Column shroud */}
      <polygon points="222,396 278,396 292,450 208,450" fill={FILL_2} stroke={LINE} strokeWidth="1" />
      {/* Rim: outer edge, body, inner highlight */}
      <path d="M188 459 A124 124 0 1 1 312 459" fill="none" stroke="url(#g-rim)" strokeWidth="20" strokeLinecap="butt" />
      <path d="M182 470 A134 134 0 1 1 318 470" fill="none" stroke={LINE_STRONG} strokeWidth="1" />
      <path d="M193 451 A114 114 0 1 1 307 451" fill="none" stroke={LINE_STRONG} strokeWidth="1" />
      <path d="M190 455 A120 120 0 1 1 310 455" fill="none" stroke={W(0.08)} strokeWidth="1" />
      <path d="M180 262 A100 100 0 0 1 320 262" fill="none" stroke={W(0.28)} strokeWidth="2" strokeLinecap="round" />
      {/* Thumb rests */}
      <ellipse cx="146" cy="350" rx="7" ry="11" fill={W(0.1)} transform="rotate(-24 146 350)" />
      <ellipse cx="354" cy="350" rx="7" ry="11" fill={W(0.1)} transform="rotate(24 354 350)" />
      {/* Spokes */}
      <path d="M212 366 L140 352 M288 366 L360 352 M250 404 L250 446" stroke={W(0.2)} strokeWidth="14" strokeLinecap="round" />
      <path d="M212 366 L140 352 M288 366 L360 352 M250 404 L250 446" stroke={LINE_STRONG} strokeWidth="1" strokeLinecap="round" />
      {/* Hub / airbag cover */}
      <rect x="204" y="338" width="92" height="64" rx="22" fill={FILL_3} stroke={LINE_STRONG} strokeWidth="1.2" />
      <rect x="214" y="346" width="72" height="48" rx="16" fill="#fff" fillOpacity="0.02" stroke={LINE_SOFT} strokeWidth="1" />
      <circle cx="250" cy="370" r="7" fill="none" stroke={W(0.3)} strokeWidth="1.2" />
      {/* Wheel-mounted buttons */}
      {[0, 1].map((k) => (
        <g key={k}>
          <rect x={k ? 288 : 196} y="352" width="16" height="22" rx="4" fill={FILL_2} stroke={LINE} strokeWidth="1" />
          <circle cx={k ? 296 : 204} cy="358" r="1.6" fill={W(0.3)} />
          <circle cx={k ? 296 : 204} cy="368" r="1.6" fill={W(0.3)} />
        </g>
      ))}

      {/* ============ Footwells ============ */}
      {/* Pedals, driver side */}
      <rect x="176" y="418" width="14" height="30" rx="4" fill={FILL_2} stroke={LINE} strokeWidth="1" transform="rotate(-6 183 433)" />
      <rect x="136" y="420" width="28" height="18" rx="4" fill={FILL_2} stroke={LINE} strokeWidth="1" />
      <rect x="98" y="424" width="16" height="26" rx="4" fill={FILL_1} stroke={LINE_SOFT} strokeWidth="1" />
      {/* Passenger floor mat */}
      <path d="M586 420 L714 420 L730 450 L570 450 Z" fill="none" stroke={LINE_SOFT} strokeWidth="1" strokeDasharray="3 4" />

      {/* ============ Light ============ */}
      <motion.ellipse key={`pl-${id}`} cx="156" cy="448" rx="100" ry="30" fill={pool} fillOpacity="0.45" filter="url(#pool-blur)" {...on(0.9)} />
      <motion.ellipse key={`pr-${id}`} cx="650" cy="448" rx="100" ry="30" fill={pool} fillOpacity="0.45" filter="url(#pool-blur)" {...on(0.9)} />

      {[DOOR_L_UP, DOOR_R_UP, DOOR_L_LOW, DOOR_R_LOW].map((d, i) => (
        <g key={`door-${i}-${id}`}>
          <motion.path d={d} fill="none" stroke={stroke} strokeWidth="9" strokeLinecap="round" strokeOpacity="0.5" filter="url(#strip-glow)" {...on(0.55)} />
          <motion.path d={d} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" {...on(0.55)} />
        </g>
      ))}

      <motion.path key={`dg-${id}`} d={DASH} fill="none" stroke={stroke} strokeWidth="11" strokeLinecap="round" strokeOpacity="0.5" filter="url(#strip-glow)" {...on(0)} />
      <motion.path key={`ds-${id}`} d={DASH} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" {...on(0)} />

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
