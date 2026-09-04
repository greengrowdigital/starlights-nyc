import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

/**
 * Media arrives by growing into place.
 *
 * A panel starts slightly small and slightly dim while it is still low in the
 * viewport and settles to full size as it reaches the middle. It is scrubbed
 * by the scroll rather than fired once, so scrolling back and forth feels like
 * moving a physical object, not replaying a clip. This is the entrance for
 * every large surface on the page: the ceiling preview, the cabin, the car
 * drawing, the gallery frames.
 */
export default function ScrollScale({
  children,
  className = '',
  from = 0.92,
  dim = 0.55,
  style = {},
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 95%', 'center 55%'],
  });

  const eased = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.6 });
  const scale = useTransform(eased, [0, 1], [reduced ? 1 : from, 1]);
  const opacity = useTransform(eased, [0, 1], [reduced ? 1 : dim, 1]);

  return (
    <motion.div ref={ref} className={className} style={{ scale, opacity, ...style }}>
      {children}
    </motion.div>
  );
}
