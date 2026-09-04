import { useEffect, useRef } from 'react';

/**
 * The product, rendered.
 *
 * A canvas starfield used twice: full-bleed behind the hero, and inside the
 * ceiling preview where the star count is the thing being sold — so the number
 * on the price card and the number of points on screen are the same number.
 *
 * Performance notes, because 1,100 twinkling points is where naive canvas work
 * falls over:
 *  - Each star is a pre-rendered sprite drawn with drawImage, not a fresh
 *    radial gradient per frame. Gradients are built once, at mount.
 *  - Positions are normalised 0..1, so a resize re-projects instead of
 *    re-randomising: the sky does not reshuffle when you rotate your phone.
 *  - An IntersectionObserver stops the loop the moment the canvas leaves the
 *    viewport, so the hero is not burning frames while you read the price list.
 *  - prefers-reduced-motion renders one static frame and never starts a loop.
 */

const PALETTE = [
  { color: '255, 244, 214', weight: 0.62 }, // warm fiber-optic white
  { color: '255, 255, 255', weight: 0.24 }, // neutral white
  { color: '207, 227, 255', weight: 0.14 }, // cool white
];

function buildSprite(color) {
  const size = 64;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // A hard, small core with a fast falloff. Fiber-optic points are pinpricks
  // with a faint halo — a soft gradient turns the ceiling into bokeh, which is
  // the single fastest way to make this look like a stock photo instead of the
  // product.
  gradient.addColorStop(0, `rgba(${color}, 1)`);
  gradient.addColorStop(0.08, `rgba(${color}, 1)`);
  gradient.addColorStop(0.16, `rgba(${color}, 0.55)`);
  gradient.addColorStop(0.34, `rgba(${color}, 0.12)`);
  gradient.addColorStop(0.62, `rgba(${color}, 0.03)`);
  gradient.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}

/** Weighted pick, so the ceiling stays mostly warm with a few cool points. */
function pickSpriteIndex(r) {
  let acc = 0;
  for (let i = 0; i < PALETTE.length; i += 1) {
    acc += PALETTE[i].weight;
    if (r <= acc) return i;
  }
  return 0;
}

export default function Starfield({
  density = 500,
  densityValue = null,
  shooting = 0,
  className = '',
  brightness = 1,
  seed = 1,
}) {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const targetRef = useRef(density);
  const valueRef = useRef(densityValue);

  // Keep the loop reading refs so changing density never remounts the canvas —
  // the sky grows and thins in place when you pick a different kit.
  //
  // `densityValue` is an optional Framer MotionValue. When it is supplied the
  // loop reads it directly every frame, which is how the pinned ceiling is
  // driven by the scroll without a single React re-render: the number changes
  // sixty times a second and nothing above this canvas notices.
  targetRef.current = density;
  valueRef.current = densityValue;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sprites = PALETTE.map((entry) => buildSprite(entry.color));
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let shots = [];
    let nextShot = 800 + Math.random() * 2600;
    let last = performance.now();
    let elapsed = 0;

    // A tiny deterministic PRNG so the same `seed` always draws the same sky.
    let state = seed * 9301 + 49297;
    const rand = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };

    const makeStar = () => ({
      x: rand(),
      y: rand(),
      // Most points are pinpricks; a handful are the ones your eye lands on.
      r: 0.55 + Math.pow(rand(), 3) * 2.6,
      base: 0.35 + rand() * 0.65,
      phase: rand() * Math.PI * 2,
      speed: 0.25 + rand() * 0.9,
      sprite: pickSpriteIndex(rand()),
      // When this point first became visible. Stars that join the ceiling as
      // the density rises fade on over ~0.7s instead of popping, which is what
      // fiber actually does when the illuminator warms up.
      born: -1,
    });
    let lastCount = 0;

    /**
     * Grow the pool to the largest density ever asked for, and let `draw` render
     * only the first `want` of them.
     *
     * Truncating on a decrease looked equivalent but was not: the discarded tail
     * would be regenerated from a PRNG that had moved on, so stepping
     * 800 -> 550 -> 800 drew three different ceilings. The preview is sold as
     * "actual density, actual layout", so going back to a kit has to bring back
     * the same sky.
     */
    const sync = () => {
      const raw = valueRef.current ? valueRef.current.get() : targetRef.current;
      const want = Math.max(0, Math.round(raw));
      const stars = starsRef.current;
      for (let i = stars.length; i < want; i += 1) stars.push(makeStar());
      const count = Math.min(want, stars.length);
      // Points that just went dark forget their birth, so they fade back on
      // rather than reappearing at full brightness when the density climbs.
      if (count < lastCount) {
        for (let i = count; i < lastCount && i < stars.length; i += 1) stars[i].born = -1;
      }
      lastCount = count;
      return count;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnShot = () => {
      const fromLeft = rand() > 0.5;
      shots.push({
        x: fromLeft ? -0.1 : 0.6 + rand() * 0.5,
        y: rand() * 0.55,
        // Shallow angle: a streak that grazes the ceiling, not a firework.
        vx: (fromLeft ? 1 : -1) * (0.55 + rand() * 0.35),
        vy: 0.16 + rand() * 0.2,
        life: 0,
        span: 0.9 + rand() * 0.5,
        len: 90 + rand() * 130,
      });
    };

    const drawShot = (shot) => {
      const progress = shot.life / shot.span;
      const alpha = Math.sin(Math.PI * progress);
      if (alpha <= 0) return;
      const x = (shot.x + shot.vx * progress) * width;
      const y = (shot.y + shot.vy * progress) * height;
      const angle = Math.atan2(shot.vy * height, shot.vx * width);
      const tailX = x - Math.cos(angle) * shot.len;
      const tailY = y - Math.sin(angle) * shot.len;

      const gradient = ctx.createLinearGradient(tailX, tailY, x, y);
      gradient.addColorStop(0, 'rgba(255, 244, 214, 0)');
      gradient.addColorStop(1, `rgba(255, 244, 214, ${0.85 * alpha})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(x, y);
      ctx.stroke();

      const head = 16;
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprites[0], x - head / 2, y - head / 2, head, head);
      ctx.globalAlpha = 1;
    };

    const draw = (dt) => {
      const count = sync();
      ctx.clearRect(0, 0, width, height);
      const stars = starsRef.current;

      for (let i = 0; i < count; i += 1) {
        const star = stars[i];
        if (star.born < 0) star.born = elapsed;
        const warm = reduced ? 1 : Math.min(1, (elapsed - star.born) / 0.7);
        const twinkle = reduced
          ? star.base
          : star.base * (0.55 + 0.45 * Math.sin(elapsed * star.speed + star.phase));
        const alpha = Math.max(0, Math.min(1, twinkle * brightness * warm));
        if (alpha < 0.015) continue;
        const size = star.r * 6;
        ctx.globalAlpha = alpha;
        ctx.drawImage(
          sprites[star.sprite],
          star.x * width - size / 2,
          star.y * height - size / 2,
          size,
          size,
        );
      }
      ctx.globalAlpha = 1;

      if (shooting > 0 && !reduced) {
        nextShot -= dt * 1000;
        if (nextShot <= 0 && shots.length < shooting) {
          spawnShot();
          nextShot = 1400 + Math.random() * 3200;
        }
        shots = shots.filter((shot) => {
          shot.life += dt;
          return shot.life < shot.span;
        });
        shots.forEach(drawShot);
      }
    };

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      draw(dt);
      raf = window.requestAnimationFrame(loop);
    };

    resize();
    draw(0);

    if (!reduced) {
      const io = new IntersectionObserver(
        (entries) => {
          // Read the LAST entry, not the first: the observer can deliver a
          // batch, and the oldest one is stale. Taking entries[0] can leave the
          // loop running on a canvas that has already scrolled away.
          const entry = entries[entries.length - 1];
          visible = entry.isIntersecting;
          if (visible && !raf) {
            last = performance.now();
            raf = window.requestAnimationFrame(loop);
          } else if (!visible && raf) {
            window.cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { rootMargin: '120px' },
      );
      io.observe(canvas);

      const ro = new ResizeObserver(() => {
        resize();
        draw(0);
      });
      ro.observe(canvas);

      return () => {
        io.disconnect();
        ro.disconnect();
        if (raf) window.cancelAnimationFrame(raf);
      };
    }

    const ro = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [brightness, seed, shooting]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full ${className}`}
    />
  );
}
