import Section, { SectionHead } from '../components/Section';
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal';
import Placeholder from '../components/Placeholder';
import { useLang } from '../i18n/LanguageContext';

/**
 * The gallery is built as an editorial grid rather than a uniform tile wall, so
 * that when real photography lands it already has a hierarchy: one hero frame,
 * one vertical, three supporting shots.
 *
 * Every slot reserves its exact aspect ratio right now, which means dropping in
 * the client's photos later cannot shift a single pixel of this layout.
 * Replace a slot by passing `src` (and a real `alt`) — nothing else changes.
 */
const SLOTS = [
  { id: 'hero', ratio: '16 / 10', span: 'lg:col-span-7', en: 'Starlight ceiling — full install', es: 'Techo estrellado — instalación completa' },
  { id: 'tall', ratio: '4 / 5', span: 'lg:col-span-5', en: 'Suede headliner detail', es: 'Detalle del forrado en gamuza' },
  { id: 'a', ratio: '4 / 3', span: 'lg:col-span-4', en: 'Shooting stars in motion', es: 'Estrellas fugaces en movimiento' },
  { id: 'b', ratio: '4 / 3', span: 'lg:col-span-4', en: 'Flow Series — doors lit', es: 'Flow Series — puertas encendidas' },
  { id: 'c', ratio: '4 / 3', span: 'lg:col-span-4', en: 'Footwell + dash at night', es: 'Pisos y tablero de noche' },
];

export default function Gallery() {
  const { t, lang } = useLang();

  return (
    <Section id="work" theme="dark">
      <SectionHead
        index={t.gallery.index}
        label={t.gallery.label}
        title={t.gallery.title}
        italic={t.gallery.titleItalic}
        lead={t.gallery.lead}
      />

      <RevealGroup
        className="mt-[clamp(2.5rem,7vh,4rem)] grid gap-4 lg:grid-cols-12"
        stagger={0.07}
      >
        {SLOTS.map((slot) => (
          <RevealItem key={slot.id} className={slot.span}>
            <Placeholder
              ratio={slot.ratio}
              label={t.gallery.placeholder}
              caption={lang === 'es' ? slot.es : slot.en}
              className="hover-lift h-full"
            />
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal delay={0.08}>
        <p className="label-mono t-fg-faint mt-6 text-center">{t.gallery.soon}</p>
      </Reveal>
    </Section>
  );
}
