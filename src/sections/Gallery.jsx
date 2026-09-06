import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Section, { SectionHead } from '../components/Section';
import Reveal from '../components/Reveal';
import ScrollScale from '../components/ScrollScale';
import Placeholder from '../components/Placeholder';
import { useLang } from '../i18n/LanguageContext';

/**
 * The work, in the shop's own photographs.
 *
 * Everything was shot on a phone, upright, so the grid is built for portrait:
 * five columns of 3:4 frames with one 2x2 hero frame, and a text tile carrying
 * the emblem where the eleventh photo would have gone. Frames grow into place
 * as they enter, and alternate columns drift against the scroll, so the grid
 * reads as a wall you walk past rather than a page you page.
 *
 * Every frame reserves its aspect ratio, so swapping a photo can never shift
 * the layout. Order is by strength: the dash-and-stars shot leads.
 */
const PHOTOS = [
  { src: '/media/photo-11.jpg', big: true, en: 'Flow Series dash, starlight ceiling', es: 'Tablero Flow Series, techo estrellado' },
  { src: '/media/photo-07.jpg', en: 'Starlight over red leather', es: 'Estrellas sobre cuero rojo' },
  { src: '/media/photo-10.jpg', en: 'Console trim, lit', es: 'Consola con la moldura encendida' },
  { src: '/media/photo-06.jpg', en: 'Ceiling with violet accents', es: 'Techo con acentos violeta' },
  { src: '/media/photo-02.jpg', en: 'Dash strip, magenta', es: 'Tira del tablero, magenta' },
  { src: '/media/photo-01.jpg', en: 'Footwell and dash, green', es: 'Pisos y tablero, verde' },
  { src: '/media/photo-03.jpg', en: 'Daylight, dash in blue', es: 'De día, tablero en azul' },
  { src: '/media/photo-09.jpg', en: 'Door card trim, blue', es: 'Moldura de puerta, azul' },
  { src: '/media/photo-08.jpg', en: 'Trim on the bench — install in progress', es: 'Moldura en el banco — instalación en proceso' },
  { src: '/media/photo-05.jpg', en: 'Ambient, low', es: 'Ambiental, en bajo' },
];

export default function Gallery() {
  const { t, lang } = useLang();
  const reduced = useReducedMotion();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const driftA = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 28, reduced ? 0 : -28]);
  const driftB = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : -16, reduced ? 0 : 16]);

  return (
    <Section id="work" theme="dark">
      <SectionHead
        index={t.gallery.index}
        label={t.gallery.label}
        title={t.gallery.title}
        italic={t.gallery.titleItalic}
        lead={t.gallery.lead}
      />

      <div ref={ref} className="mt-[clamp(2.5rem,7vh,4rem)] grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {PHOTOS.map((photo, i) => {
          const caption = lang === 'es' ? photo.es : photo.en;
          const col = i % 5;
          const y = col % 2 ? driftB : driftA;
          return (
            <motion.div
              key={photo.src}
              className={photo.big ? 'col-span-2 row-span-2' : ''}
              style={{ y }}
            >
              <ScrollScale className="h-full" from={0.94} dim={0.5}>
                <Placeholder
                  ratio={photo.big ? '3 / 4' : '3 / 4'}
                  src={photo.src}
                  alt={caption}
                  className="hover-lift h-full"
                >
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10">
                    <span className="label-mono text-white/75">{caption}</span>
                  </figcaption>
                </Placeholder>
              </ScrollScale>
            </motion.div>
          );
        })}

        {/* The eleventh cell: the shop's own mark and its line. */}
        <motion.div className="col-span-2 sm:col-span-1 lg:col-span-1" style={{ y: driftB }}>
          <ScrollScale className="h-full" from={0.94} dim={0.5}>
            <div className="t-line flex aspect-[3/4] h-full flex-col items-center justify-center gap-5 rounded-[var(--radius-card)] border bg-white/[0.03] p-6 text-center">
              <img
                src="/logo.jpeg"
                alt="NYC Starlights"
                className="h-24 w-24 rounded-full object-cover shadow-[0_0_40px_-8px_rgb(255_244_214/0.5)]"
                loading="lazy"
              />
              <span className="label-mono t-fg-muted">{t.gallery.tagline}</span>
            </div>
          </ScrollScale>
        </motion.div>
      </div>

      <Reveal delay={0.08}>
        <p className="label-mono t-fg-faint mt-6 text-center">{t.gallery.soon}</p>
      </Reveal>
    </Section>
  );
}
