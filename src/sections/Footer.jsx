import { ArrowUp, Instagram, Mail, MessageSquare, Phone } from 'lucide-react';
import { Container } from '../components/Section';
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal';
import MaskText from '../components/MaskText';
import Starfield from '../components/Starfield';
import { CONTACT, SITE } from '../config';
import { useLang } from '../i18n/LanguageContext';

/**
 * The page closes where it opened: back on black, under the same sky. The
 * contact block is four equal doors — call, text, email, follow — because a
 * customer who scrolled this far has already decided, and the only job left is
 * to not make them hunt for the number.
 */
export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  const doors = [
    { icon: Phone, label: t.footer.call, value: CONTACT.phone, href: CONTACT.phoneHref },
    { icon: MessageSquare, label: t.footer.text, value: CONTACT.phone, href: CONTACT.smsHref },
    { icon: Mail, label: t.footer.email, value: CONTACT.email, href: CONTACT.emailHref },
    {
      icon: Instagram,
      label: t.footer.follow,
      value: `@${CONTACT.instagram}`,
      href: CONTACT.instagramHref,
      external: true,
    },
  ];

  return (
    <footer
      data-theme="dark"
      className="relative isolate overflow-hidden pt-[clamp(5rem,14vh,9rem)]"
    >
      <div className="absolute inset-0 -z-10">
        <div className="fade-y absolute inset-0 opacity-70">
          <Starfield density={340} shooting={1} seed={99} brightness={0.8} />
        </div>
        <div className="grain pointer-events-none absolute inset-0" />
      </div>

      <Container>
        <Reveal>
          <img
            src="/logo.jpeg"
            alt="NYC Starlights — Illuminate your drive"
            width="112"
            height="112"
            loading="lazy"
            className="mb-8 h-24 w-24 rounded-full object-cover shadow-[0_0_60px_-10px_rgb(255_244_214/0.45)] ring-1 ring-white/15 sm:h-28 sm:w-28"
          />
        </Reveal>
        <MaskText
          as="h2"
          text={t.footer.title}
          className="type-hero t-fg max-w-[16ch]"
          amount={0.4}
        />

        <RevealGroup className="mt-12 grid gap-px sm:grid-cols-2 lg:grid-cols-4" stagger={0.08} delay={0.2}>
          {doors.map((door) => (
            <RevealItem key={door.label}>
              <a
                href={door.href}
                target={door.external ? '_blank' : undefined}
                rel={door.external ? 'noreferrer' : undefined}
                className="group t-line flex flex-col gap-3 border-b py-6 transition-colors duration-500 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0"
              >
                <door.icon
                  className="t-fg-faint h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="label-mono t-fg-faint">{door.label}</span>
                <span className="t-fg text-[1.0625rem] tracking-tight">{door.value}</span>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.12}>
          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href={CONTACT.tiktokHref}
              target="_blank"
              rel="noreferrer"
              className="t-fg-muted hover:t-fg text-[0.875rem]"
            >
              TikTok @{CONTACT.tiktok}
            </a>
            <span className="t-fg-faint text-[0.875rem]">{CONTACT.city}</span>
            <span className="t-fg-faint text-[0.875rem]">{t.footer.warranty}</span>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="t-fg-muted mt-10 max-w-[62ch] text-pretty text-[0.9375rem] leading-relaxed">
            {t.footer.thanks}
          </p>
        </Reveal>

        <div className="t-line mt-14 flex flex-col gap-4 border-t py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-mono t-fg-faint">
            © {year} {SITE.name} · {t.footer.rights}
          </p>

          <div className="flex items-center gap-6">
            <span className="label-mono t-fg-faint">{t.footer.built}</span>
            <a
              href="#top"
              className="t-line t-fg flex h-10 w-10 items-center justify-center rounded-full border transition-transform duration-500 hover:-translate-y-0.5"
              aria-label={t.footer.backToTop}
            >
              <ArrowUp className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
