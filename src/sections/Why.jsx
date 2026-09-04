import { Gem, ShieldCheck, Wrench, Zap } from 'lucide-react';
import Section, { SectionHead } from '../components/Section';
import { RevealGroup, RevealItem } from '../components/Reveal';
import { useLang } from '../i18n/LanguageContext';

const ICONS = [Zap, ShieldCheck, Wrench, Gem];

/**
 * The reassurance act, on the lightest surface of the page. Four claims, one
 * icon each, no photography and no badges — the four things a customer needs
 * to hear before handing over their car for a day.
 */
export default function Why() {
  const { t } = useLang();

  return (
    <Section id="why" theme="smoke">
      <SectionHead
        index={t.why.index}
        label={t.why.label}
        title={t.why.title}
        italic={t.why.titleItalic}
        align="center"
      />

      <RevealGroup
        className="mt-[clamp(3rem,8vh,4.5rem)] grid gap-4 sm:grid-cols-2"
        stagger={0.08}
      >
        {t.why.items.map((item, i) => {
          const Icon = ICONS[i] || Zap;
          return (
            <RevealItem key={item.title} className="h-full">
              <article
                className="t-line hover-lift flex h-full flex-col gap-4 rounded-[var(--radius-card)] border bg-white/50 p-7 sm:p-9"
              >
                <Icon className="t-fg h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="type-title t-fg">{item.title}</h3>
                <p className="t-fg-muted text-[0.9375rem] leading-relaxed text-pretty">
                  {item.body}
                </p>
              </article>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Section>
  );
}
