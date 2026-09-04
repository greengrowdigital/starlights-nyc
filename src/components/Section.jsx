import Reveal from './Reveal';

/**
 * Every act of the scroll is a <Section>. It owns three things:
 *  - `theme`, which is what the background morph reads to know what colour
 *    this stretch of page should be turning into;
 *  - the shared vertical rhythm and 1200px content measure;
 *  - the editorial header (index · label · headline · lead) so no two sections
 *    invent their own hierarchy.
 */
export default function Section({
  id,
  theme = 'dark',
  className = '',
  children,
  full = false,
  pad = 'py-[clamp(5rem,12vh,9rem)]',
}) {
  return (
    <section
      id={id}
      data-theme={theme}
      className={`relative isolate ${pad} ${className}`}
    >
      {full ? children : <Container>{children}</Container>}
    </section>
  );
}

export function Container({ className = '', children }) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHead({
  index,
  label,
  title,
  italic,
  lead,
  align = 'left',
  className = '',
}) {
  const centered = align === 'center';
  return (
    <header className={`${centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'} ${className}`}>
      {(index || label) && (
        <Reveal>
          <div
            className={`flex items-center gap-3 ${centered ? 'justify-center' : ''}`}
          >
            {index && <span className="label-mono t-fg-faint tnum">{index}</span>}
            {index && label && (
              <span className="t-surface-2 h-px w-8" aria-hidden="true" />
            )}
            {label && <span className="label-mono t-fg-muted">{label}</span>}
          </div>
        </Reveal>
      )}

      {title && (
        <Reveal delay={0.06}>
          <h2 className="type-display t-fg mt-6 text-balance">
            {title}
            {italic && (
              <>
                {' '}
                <span className="ital">{italic}</span>
              </>
            )}
          </h2>
        </Reveal>
      )}

      {lead && (
        <Reveal delay={0.12}>
          <p className={`type-lead t-fg-muted mt-5 text-pretty ${centered ? '' : 'max-w-xl'}`}>
            {lead}
          </p>
        </Reveal>
      )}
    </header>
  );
}
