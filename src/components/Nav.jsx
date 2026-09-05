import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { lockScroll, unlockScroll } from '../lib/scroll';
import { INTRO } from '../lib/intro';

const EASE = [0.16, 1, 0.3, 1];

const LINKS = [
  { href: '#ceiling', key: 'ceiling' },
  { href: '#headliner', key: 'headliner' },
  { href: '#flow', key: 'flow' },
  { href: '#why', key: 'why' },
  { href: '#work', key: 'work' },
];

/**
 * The nav never picks a colour of its own: it is painted in --fg over a blurred
 * sample of whatever the background currently is, so it inverts continuously
 * with the scroll instead of flipping at a breakpoint.
 */
export default function Nav() {
  const { t, lang, toggle } = useLang();
  const reduced = useReducedMotion();
  // Entrance cue for one part of the bar. Nothing under reduced motion.
  const arrive = (delay) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: -8 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.8, ease: EASE },
        };
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState('');
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);

  // Coalesced to one read per frame, like every other scroll consumer here.
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  /**
   * Modal behaviour for the mobile sheet: lock the page, close on Escape, move
   * focus in, keep Tab inside, and hand focus back to the button that opened it.
   *
   * Without the trap, a keyboard or screen-reader user tabs straight out of the
   * sheet into the page underneath — which is still there, still focusable, and
   * completely hidden behind an opaque panel. Declaring aria-modal while that is
   * possible is worse than not declaring it at all.
   */
  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lockScroll();
    const opener = triggerRef.current;

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll('a[href], button:not([disabled])') || [],
      );

    // Land on the close button: the least destructive place to start.
    window.requestAnimationFrame(() => {
      const items = focusables();
      const close = items.find((el) => el.getAttribute('aria-label') === t.nav.close);
      (close || items[0])?.focus();
    });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      unlockScroll();
      window.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [open, t.nav.close]);

  /**
   * Which section is under the reader. Drives the sliding underline in the
   * desktop nav — a small thing, but on a page that is one long scroll it is
   * the only "you are here" the visitor ever gets besides the progress hair.
   */
  useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1));
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!nodes.length) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        // Prefer the entry closest to the top of the viewport that is visible.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-[110]"
        style={{
          backdropFilter: scrolled ? 'blur(18px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(180%)' : 'none',
          backgroundColor: scrolled ? 'rgb(var(--bg) / 0.72)' : 'transparent',
          borderBottom: scrolled ? '1px solid rgb(var(--fg) / 0.1)' : '1px solid transparent',
          transition: 'background-color 0.5s var(--ease-lux), border-color 0.5s var(--ease-lux)',
        }}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-[var(--nav-h)] w-full max-w-[1200px] items-center justify-between gap-6 px-6 sm:px-8 lg:px-12"
        >
          {/* The brand is the first thing to appear after the stars. */}
          <motion.a
            href="#top"
            className="t-fg flex shrink-0 items-center gap-2"
            aria-label="STARLIGHTS.NYC — home"
            {...arrive(INTRO.brand)}
          >
            <StarMark />
            <span
              className="text-[0.82rem] font-semibold"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.16em' }}
            >
              STARLIGHTS<span className="t-fg-faint">.NYC</span>
            </span>
          </motion.a>

          <ul className="hidden items-center gap-8 lg:flex">
            {LINKS.map((link, i) => {
              const current = activeId === link.href.slice(1);
              return (
                <motion.li
                  key={link.href}
                  className="relative"
                  {...arrive(INTRO.nav + i * INTRO.navStagger)}
                >
                  <a
                    href={link.href}
                    aria-current={current ? 'location' : undefined}
                    className={`${current ? 't-fg' : 't-fg-strong hover:t-fg'} block py-2 text-[0.82rem]`}
                    style={{ transition: 'color 0.3s var(--ease-lux)' }}
                  >
                    {t.nav[link.key]}
                  </a>
                  {current && (
                    <motion.span
                      layoutId="nav-active"
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-0.5 h-px"
                      style={{ backgroundColor: 'rgb(var(--fg) / 0.8)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}
                </motion.li>
              );
            })}
          </ul>

          <motion.div
            className="flex items-center gap-2 sm:gap-3"
            {...arrive(INTRO.nav + LINKS.length * INTRO.navStagger)}
          >
            <button
              type="button"
              onClick={toggle}
              className="t-line label-mono t-fg-strong hover:t-fg rounded-full border px-3 py-2 transition-colors"
              aria-label={`${t.nav.language}: ${lang === 'en' ? 'English' : 'Español'}`}
            >
              {lang === 'en' ? 'EN' : 'ES'}
            </button>

            <a
              href="#book"
              className="btn-invert hidden rounded-full px-5 py-2.5 text-[0.82rem] font-medium sm:inline-block"
            >
              {t.nav.book}
            </a>

            <button
              type="button"
              ref={triggerRef}
              onClick={() => setOpen(true)}
              className="t-line t-fg flex h-11 w-11 items-center justify-center rounded-full border lg:hidden"
              aria-label={t.nav.menu}
              aria-expanded={open}
            >
              <Menu className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </motion.div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={dialogRef}
            className="fixed inset-0 z-[130] flex flex-col lg:hidden"
            style={{ backgroundColor: 'rgb(var(--bg))' }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.menu}
          >
            <div className="flex h-[var(--nav-h)] items-center justify-between px-6 sm:px-8">
              <span className="label-mono t-fg-faint">{t.nav.menu}</span>

              <div className="flex items-center gap-2">
                {/* The header's toggle sits underneath this sheet, so the sheet
                    carries its own — otherwise language is unreachable on a
                    phone once the menu is open. */}
                <button
                  type="button"
                  onClick={toggle}
                  className="t-line label-mono t-fg-strong rounded-full border px-3 py-2"
                  aria-label={`${t.nav.language}: ${lang === 'en' ? 'English' : 'Español'}`}
                >
                  {lang === 'en' ? 'EN' : 'ES'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="t-line t-fg flex h-11 w-11 items-center justify-center rounded-full border"
                  aria-label={t.nav.close}
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <ul className="flex flex-1 flex-col justify-center gap-1 px-6 sm:px-8">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="type-title t-fg t-line-soft block border-b py-5"
                  >
                    {t.nav[link.key]}
                  </a>
                </motion.li>
              ))}
            </ul>

            <div className="px-6 pb-10 sm:px-8">
              <a
                href="#book"
                onClick={() => setOpen(false)}
                className="btn-invert block rounded-full px-6 py-4 text-center text-[0.95rem] font-medium"
              >
                {t.nav.book}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StarMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="M12 1.5l2.2 7.3 7.3 2.2-7.3 2.2L12 20.5l-2.2-7.3L2.5 11l7.3-2.2z" />
    </svg>
  );
}
