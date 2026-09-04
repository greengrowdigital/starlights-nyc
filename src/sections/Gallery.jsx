import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Section, { SectionHead } from '../components/Section';
import Reveal from '../components/Reveal';
import ScrollScale from '../components/ScrollScale';
import Placeholder from '../components/Placeholder';
import { useLang } from '../i18n/LanguageContext';

/**
 * The gallery is built as an editorial grid rather than a uniform tile wall, so
 * that when real photography lands it already has a hierarchy: one hero frame,
 * one vertical, three supporting shots.
 *
 * Every frame grows into place as it enters (ScrollScale), and the vertical
 * one drifts against the scroll a little — the two columns moving at slightly
 * different speeds is what makes a flat grid read as a wall you are walking
 * past rather than a page you are paging.
 *
 * Every slot reserves its exact aspect ratio right now, which means dropping in
 * the client's photos later cannot shift a single pixel of this layout.
 * Replace a slot by passing `src` (and a real `alt`) — nothing else changes.
 */
const SLOTS = [
  { id: 'hero', ratio: '16 / 10', span: 'lg:col-span-7', drift: 0, en: 'Starlight ceiling — full install', es: 'Techo estrellado — instalación completa' },
  { id: 'tall', ratio: '4 / 5', span: 'lg:col-span-5', drift: 1, en: 'Suede headliner detail', es: 'Detalle del forrado en gamuza' },
  { id: 'a', ratio: '4 / 3', span: 'lg:col-span-4', drift: 0, en: 'Shooting stars in motion', es: 'Estrellas fugaces en movimiento' },
  { id: 'b', ratio: '4 / 3', span: 'lg:col-span-4', drift: 0.5, en: 'Flow Series — doors lit', es: 'Flow Series — puertas encendidas' },
  { id: 'c', ratio: '4 / 3', span: 'lg:col-span-4', drift: 0, en: 'Footwell + dash at night', es: 'Pisos y tablero de noche' },
];

export default function Gallery() {
  const { t, lang } = useLang();
  const reduced = useReducedMotion();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  // Full drift for the vertical frame, half for one of the small ones, so the
  // grid has three speeds instead of two.
  const driftFull = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 36, reduced ? 0 : -36]);
  const driftHalf = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 18, reduced ? 0 : -18]);

  return (
    <Section id="work" theme="dark">
      <SectionHead
        index={t.gallery.index}
        label={t.gallery.label}
        title={t.gallery.title}
        italic={t.gallery.titleItalic}
        lead={t.gallery.lead}
      />

      <div ref={ref} className="mt-[clamp(2.5rem,7vh,4rem)] grid gap-4 lg:grid-cols-12">
        {SLOTS.map((slot) => {
          const y = slot.drift === 1 ? driftFull : slot.drift === 0.5 ? driftHalf : undefined;
          return (
            <motion.div key={slot.id} className={slot.span} style={y ? { y } : undefined}>
              <ScrollScale className="h-full" from={0.94} dim={0.5}>
                <Placeholder
                  ratio={slot.ratio}
                  label={t.gallery.placeholder}
                  caption={lang === 'es' ? slot.es : slot.en}
                  className="hover-lift h-full"
                />
              </ScrollScale>
            </motion.div>
          );
        })}
      </div>

      <Reveal delay={0.08}>
        <p className="label-mono t-fg-faint mt-6 text-center">{t.gallery.soon}</p>
      </Reveal>
    </Section>
  );
}
