import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { lockScroll, unlockScroll } from '../lib/scroll';

/**
 * Page reveal. A short black curtain with the wordmark, then it lifts to
 * expose the hero — which is already black, so the handover reads as the room
 * opening rather than a screen being swapped.
 *
 * Hard rule: the curtain never outlives 1.5s, and it never blocks a keyboard
 * user, because it is removed from the tree the moment it finishes.
 */
export default function Loader() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(reduced);

  // Save and restore the value we found rather than blanking it. The nav's
  // mobile sheet locks the same property, and a component that clears it
  // unconditionally can either unlock a page that should be locked or — if the
  // order goes the other way — leave it locked forever.
  useEffect(() => {
    if (reduced || done) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lockScroll();
    const timer = window.setTimeout(() => setDone(true), 1350);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
      unlockScroll();
    };
  }, [reduced, done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden="true"
        >
          <motion.span
            className="label-mono text-white/80"
            style={{ letterSpacing: '0.5em' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            STARLIGHTS.NYC
          </motion.span>

          <div className="mt-6 h-px w-40 overflow-hidden bg-white/15">
            <motion.div
              className="h-full bg-white"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: 1.15, ease: [0.65, 0, 0.35, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
