import { useEffect, useRef } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { interpolate } from 'flubber';

/**
 * A car in profile, drawn the way a body engineer would sketch it.
 *
 * Three real silhouettes — coupe, sedan, SUV — with the proportions of the
 * actual vehicles: wheelbase, ground clearance, belt line, greenhouse, the
 * rake of the A-pillar and the mass of the C. The pillars are drawn as what
 * they are on a real car: the bands of metal between the pieces of glass. So
 * when the customer ticks "A-Pillars", the exact part they are paying to have
 * wrapped lights up, and it is obvious why it is a separate line item.
 *
 * Switching body style morphs the whole drawing rather than swapping it. The
 * body outline is interpolated with flubber (any path to any path, no shared
 * command structure needed); glass, pillars, lights and handles are fixed-count
 * polygons Framer can tween directly; wheels move and resize.
 *
 * Geometry lives in VEHICLES. viewBox is 600x240 with the ground at y=212.
 */

const GROUND = 212;

const VEHICLES = {
  'suede-coupe': {
    // Low, long door, fastback. Roof 64, belt 120, sill 204.
    body: 'M58 196 C46 190 44 166 54 150 C60 140 78 136 98 134 L210 124 C220 122 228 118 238 110 L288 76 C298 68 314 64 332 64 L372 64 C392 64 408 70 424 84 L480 112 C492 118 506 120 522 120 C538 122 548 128 548 142 L546 194 C546 200 540 204 532 204 L500 204 C500 124 396 124 396 204 L212 204 C212 124 108 124 108 204 L74 204 C64 204 58 200 58 196 Z',
    wheels: [
      { cx: 160, cy: 172, r: 40 },
      { cx: 448, cy: 172, r: 40 },
    ],
    belt: 120,
    roof: 70,
    a: { bottom: 240, top: 290 },
    b: { x: 352 },
    c: { top: 396, bottom: 440 },
    // The fastback glass reaches well back over the deck.
    backlightReach: { dx: 40, dy: 18, bx: 34, by: -6 },
    mirror: [222, 112],
    handles: [[318, 136, 20]],
    seams: [
      [244, 124, 230, 204], // front door leading edge
      [446, 124, 456, 204], // door trailing edge
    ],
    headlight: [[56, 146], [96, 138], [98, 152], [62, 158]],
    taillight: [[534, 128], [548, 132], [548, 152], [534, 152]],
    sill: [222, 198, 392, 198],
    hoodLine: [[106, 138], [232, 120]],
    rails: null,
  },
  'suede-sedan': {
    // Three-box. Roof 58, belt 116, sill 204.
    body: 'M62 196 C50 190 46 164 56 146 C62 136 80 130 100 128 L200 120 C210 118 218 114 226 106 L266 70 C274 62 288 58 304 58 L372 58 C388 58 400 62 410 72 L442 102 C450 108 462 110 478 110 L526 112 C540 114 550 122 550 138 L548 194 C548 200 542 204 534 204 L500 204 C500 128 400 128 400 204 L202 204 C202 128 102 128 102 204 L78 204 C68 204 62 200 62 196 Z',
    wheels: [
      { cx: 152, cy: 174, r: 38 },
      { cx: 450, cy: 174, r: 38 },
    ],
    belt: 116,
    roof: 64,
    a: { bottom: 228, top: 268 },
    b: { x: 338 },
    c: { top: 406, bottom: 440 },
    backlightReach: { dx: 18, dy: 8, bx: 16, by: -2 },
    mirror: [210, 108],
    handles: [
      [296, 132, 18],
      [396, 132, 18],
    ],
    seams: [
      [232, 120, 222, 204],
      [340, 120, 340, 204],
      [440, 120, 446, 204],
    ],
    headlight: [[58, 140], [96, 132], [98, 146], [64, 152]],
    taillight: [[536, 122], [550, 126], [550, 148], [536, 148]],
    sill: [212, 198, 396, 198],
    hoodLine: [[108, 132], [222, 116]],
    rails: null,
  },
  'suede-suv': {
    // Tall, boxy, high sill, roof rails. Roof 42, belt 110, sill 188.
    body: 'M60 190 C48 184 46 154 56 136 C62 124 82 118 104 116 L200 108 C208 106 214 102 220 94 L248 54 C254 46 268 42 286 42 L452 42 C468 42 480 46 486 56 L508 104 C512 112 520 116 534 116 L542 118 C550 122 552 130 552 142 L550 178 C550 184 544 188 536 188 L502 188 C502 118 390 118 390 188 L212 188 C212 118 100 118 100 188 L74 188 C66 188 60 194 60 190 Z',
    wheels: [
      { cx: 156, cy: 168, r: 44 },
      { cx: 446, cy: 168, r: 44 },
    ],
    belt: 110,
    roof: 50,
    a: { bottom: 222, top: 250 },
    b: { x: 326 },
    c: { top: 428, bottom: 436 },
    backlightReach: { dx: 52, dy: 2, bx: 54, by: -2 },
    mirror: [204, 102],
    handles: [
      [286, 126, 18],
      [384, 126, 18],
    ],
    seams: [
      [226, 114, 220, 188],
      [328, 114, 328, 188],
      [436, 114, 440, 188],
    ],
    headlight: [[58, 130], [100, 120], [102, 136], [64, 144]],
    taillight: [[538, 122], [552, 128], [552, 156], [538, 156]],
    sill: [214, 182, 392, 182],
    hoodLine: [[112, 120], [216, 104]],
    rails: [[290, 36], [452, 36]],
  },
};

const PW = 9; // pillar band half-width along the belt

/**
 * Turn the greenhouse parameters into the seven polygons of the glass and
 * pillars. Every polygon has exactly four points, whatever the vehicle, so
 * Framer can tween them as `points` strings.
 */
function greenhouse(v) {
  const { belt, roof, a, b, c, backlightReach: r } = v;
  return {
    windshield: [
      [a.bottom - 12, belt],
      [a.top - 9, roof + 2],
      [a.top, roof],
      [a.bottom, belt],
    ],
    pillarA: [
      [a.bottom, belt],
      [a.top, roof],
      [a.top + PW, roof],
      [a.bottom + PW, belt],
    ],
    glassFront: [
      [a.bottom + PW + 3, belt],
      [a.top + PW + 2, roof + 1],
      [b.x - 5, roof],
      [b.x - 5, belt],
    ],
    pillarB: [
      [b.x - 5, belt],
      [b.x - 5, roof],
      [b.x + 5, roof],
      [b.x + 5, belt],
    ],
    glassRear: [
      [b.x + 5, belt],
      [b.x + 5, roof],
      [c.top - 4, roof],
      [c.bottom - 6, belt],
    ],
    pillarC: [
      [c.bottom - 6, belt],
      [c.top - 4, roof],
      [c.top + 6, roof + 2],
      [c.bottom + 6, belt],
    ],
    backlight: [
      [c.bottom + 6, belt],
      [c.top + 6, roof + 2],
      [c.top + r.dx, roof + r.dy],
      [c.bottom + r.bx, belt + r.by],
    ],
  };
}

const pts = (poly) => poly.map(([x, y]) => `${x},${y}`).join(' ');
const centroid = (poly) => {
  const n = poly.length;
  const sx = poly.reduce((s, p) => s + p[0], 0);
  const sy = poly.reduce((s, p) => s + p[1], 0);
  return [sx / n, sy / n];
};

const MORPH = { duration: 0.75, ease: [0.22, 1, 0.36, 1] };
const DRAW = { duration: 1.5, ease: [0.16, 1, 0.3, 1] };

export default function CarProfile({ vehicle = 'suede-sedan', active = [] }) {
  const reduced = useReducedMotion();
  const v = VEHICLES[vehicle] || VEHICLES['suede-sedan'];
  const g = greenhouse(v);

  // The body outline is morphed imperatively with flubber. The `d` prop stays
  // pinned to the first vehicle so React never snaps the attribute between
  // frames; the effect below owns it from then on.
  const bodyRef = useRef(null);
  const currentD = useRef(v.body);
  const initialD = useRef(v.body);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;
    const from = currentD.current;
    const to = v.body;
    if (from === to) return undefined;
    if (reduced) {
      el.setAttribute('d', to);
      currentD.current = to;
      return undefined;
    }
    const interp = interpolate(from, to, { maxSegmentLength: 3 });
    const controls = animate(0, 1, {
      ...MORPH,
      onUpdate: (t) => {
        const d = interp(t);
        el.setAttribute('d', d);
        currentD.current = d;
      },
      onComplete: () => {
        el.setAttribute('d', to);
        currentD.current = to;
      },
    });
    return () => controls.stop();
  }, [v.body, reduced]);

  const lit = (id) => active.includes(id);

  // First-sight draw-in for stroked elements; morph transitions thereafter.
  const drawIn = (delay) => ({
    hidden: { pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0 },
    show: {
      pathLength: 1,
      opacity: 1,
      transition: { pathLength: { ...DRAW, delay }, opacity: { duration: 0.25, delay } },
    },
  });
  const fadeIn = (delay) => ({
    hidden: { opacity: reduced ? 1 : 0 },
    show: { opacity: 1, transition: { duration: 0.6, delay } },
  });

  const pillar = (id, poly, label, delay) => {
    const on = lit(id);
    const [cx] = centroid(poly);
    return (
      <g key={id}>
        <motion.polygon
          variants={fadeIn(delay)}
          animate={{
            points: pts(poly),
            fill: on ? 'rgb(var(--fg) / 1)' : 'rgb(var(--fg) / 0.2)',
            stroke: on ? 'rgb(var(--fg) / 1)' : 'rgb(var(--fg) / 0.35)',
          }}
          transition={{ points: MORPH, fill: { duration: 0.35 }, stroke: { duration: 0.35 } }}
          points={pts(poly)}
          strokeWidth="1"
          strokeLinejoin="round"
          style={{ filter: on ? 'url(#pillar-glow)' : 'none' }}
        />
        <motion.text
          fontSize="10.5"
          fontFamily="var(--font-mono)"
          fontWeight="500"
          textAnchor="middle"
          fill="rgb(var(--fg))"
          initial={false}
          animate={{ x: cx, y: v.roof - 12, opacity: on ? 0.95 : 0.35 }}
          transition={{ x: MORPH, y: MORPH, opacity: { duration: 0.35 } }}
        >
          {label}
        </motion.text>
      </g>
    );
  };

  return (
    <motion.svg
      viewBox="0 0 600 240"
      className="w-full"
      role="img"
      aria-label="Side profile of the selected vehicle with its A, B and C pillars"
      style={{ color: 'rgb(var(--fg))' }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
    >
      <defs>
        <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.02" />
          <stop offset="0.55" stopColor="currentColor" stopOpacity="0.05" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="car-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.06" />
        </linearGradient>
        <filter id="pillar-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="car-shadow" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Ground shadow — the one thing that makes a line drawing sit on a floor. */}
      <motion.ellipse
        variants={fadeIn(1.1)}
        cx="304"
        cy={GROUND + 2}
        rx="246"
        ry="7"
        fill="currentColor"
        fillOpacity="0.16"
        filter="url(#car-shadow)"
      />
      <motion.line
        variants={drawIn(0.9)}
        x1="30"
        y1={GROUND}
        x2="574"
        y2={GROUND}
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {/* Roof rails (SUV only) — fade with the vehicle. */}
      <motion.line
        initial={false}
        animate={{
          x1: v.rails ? v.rails[0][0] : 370,
          y1: v.rails ? v.rails[0][1] : v.roof - 6,
          x2: v.rails ? v.rails[1][0] : 372,
          y2: v.rails ? v.rails[1][1] : v.roof - 6,
          opacity: v.rails ? 0.55 : 0,
        }}
        transition={MORPH}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Body — filled, then outlined. Morphed by flubber. */}
      <motion.path
        ref={bodyRef}
        variants={drawIn(0)}
        d={initialD.current}
        fill="url(#car-body)"
        stroke="currentColor"
        strokeOpacity="0.62"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Glass */}
      {[
        ['windshield', g.windshield, 0.5],
        ['glassFront', g.glassFront, 0.6],
        ['glassRear', g.glassRear, 0.7],
        ['backlight', g.backlight, 0.8],
      ].map(([key, poly, delay]) => (
        <motion.polygon
          key={key}
          variants={fadeIn(delay)}
          animate={{ points: pts(poly) }}
          transition={{ points: MORPH }}
          points={pts(poly)}
          fill="url(#car-glass)"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ))}

      {/* Pillars — drawn over the glass, as the metal between the panes. */}
      {pillar('pillar-a', g.pillarA, 'A', 0.85)}
      {pillar('pillar-b', g.pillarB, 'B', 0.95)}
      {pillar('pillar-c', g.pillarC, 'C', 1.05)}

      {/* Belt line highlight */}
      <motion.line
        variants={drawIn(0.55)}
        initial={false}
        animate={{ x1: v.a.bottom + 4, y1: v.belt + 2, x2: v.c.bottom + 10, y2: v.belt + 2 }}
        transition={MORPH}
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="1"
      />

      {/* Shut lines: doors, hood, sill */}
      {v.seams.map((s, i) => (
        <motion.line
          key={`seam-${i}`}
          variants={drawIn(1.0 + i * 0.08)}
          initial={false}
          animate={{ x1: s[0], y1: s[1], x2: s[2], y2: s[3], opacity: 1 }}
          transition={{ x1: MORPH, y1: MORPH, x2: MORPH, y2: MORPH }}
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1"
          strokeLinecap="round"
        />
      ))}
      <motion.line
        variants={drawIn(1.05)}
        initial={false}
        animate={{ x1: v.hoodLine[0][0], y1: v.hoodLine[0][1], x2: v.hoodLine[1][0], y2: v.hoodLine[1][1] }}
        transition={MORPH}
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <motion.line
        variants={drawIn(1.1)}
        initial={false}
        animate={{ x1: v.sill[0], y1: v.sill[1], x2: v.sill[2], y2: v.sill[3] }}
        transition={MORPH}
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Mirror, handles, lights */}
      <motion.rect
        variants={fadeIn(1.0)}
        initial={false}
        animate={{ x: v.mirror[0] - 12, y: v.mirror[1] - 6 }}
        transition={MORPH}
        width="13"
        height="9"
        rx="2.5"
        fill="currentColor"
        fillOpacity="0.45"
      />
      {[0, 1].map((i) => {
        const h = v.handles[i] || v.handles[0];
        return (
          <motion.line
            key={`handle-${i}`}
            variants={fadeIn(1.15)}
            initial={false}
            animate={{ x1: h[0], y1: h[1], x2: h[0] + h[2], y2: h[1], opacity: v.handles[i] ? 1 : 0 }}
            transition={MORPH}
            stroke="currentColor"
            strokeOpacity="0.5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        );
      })}
      <motion.polygon
        variants={fadeIn(1.05)}
        animate={{ points: pts(v.headlight) }}
        transition={{ points: MORPH }}
        points={pts(v.headlight)}
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <motion.polygon
        variants={fadeIn(1.1)}
        animate={{ points: pts(v.taillight) }}
        transition={{ points: MORPH }}
        points={pts(v.taillight)}
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Wheels: tyre, rim, five spokes, hub. */}
      {v.wheels.map((w, i) => (
        <Wheel key={`wheel-${i}`} wheel={w} delay={0.7 + i * 0.12} drawIn={drawIn} fadeIn={fadeIn} />
      ))}
    </motion.svg>
  );
}

function Wheel({ wheel, delay, drawIn, fadeIn }) {
  const { cx, cy, r } = wheel;
  const rim = r * 0.62;
  const spokes = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return { x2: cx + Math.cos(a) * (rim - 3), y2: cy + Math.sin(a) * (rim - 3) };
  });

  return (
    <g>
      {/* Tyre */}
      <motion.circle
        variants={drawIn(delay)}
        initial={false}
        animate={{ cx, cy, r }}
        transition={MORPH}
        fill="rgb(var(--bg))"
        stroke="currentColor"
        strokeOpacity="0.75"
        strokeWidth="6"
      />
      {/* Rim */}
      <motion.circle
        variants={drawIn(delay + 0.15)}
        initial={false}
        animate={{ cx, cy, r: rim }}
        transition={MORPH}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      {spokes.map((s, i) => (
        <motion.line
          key={i}
          variants={fadeIn(delay + 0.3)}
          initial={false}
          animate={{ x1: cx, y1: cy, x2: s.x2, y2: s.y2 }}
          transition={MORPH}
          stroke="currentColor"
          strokeOpacity="0.32"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
      <motion.circle
        variants={fadeIn(delay + 0.3)}
        initial={false}
        animate={{ cx, cy }}
        transition={MORPH}
        r="4"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </g>
  );
}
