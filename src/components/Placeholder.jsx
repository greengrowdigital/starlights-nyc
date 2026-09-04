import { ImageIcon } from 'lucide-react';

/**
 * Photo slot.
 *
 * The client has no photography yet, so every image position renders as a
 * deliberate, on-brand plate rather than a grey box or a stock photo of
 * somebody else's car. Drop a real file in and pass `src` — nothing else about
 * the layout changes, because the slot already reserves its exact aspect ratio
 * (so swapping in photography cannot shift the page).
 */
export default function Placeholder({
  src,
  alt = '',
  ratio = '4 / 3',
  label,
  caption,
  className = '',
  rounded = 'rounded-[var(--radius-card)]',
  children,
}) {
  return (
    <figure
      className={`t-line relative overflow-hidden border ${rounded} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgb(var(--fg) / 0.07) 0%, rgb(var(--fg) / 0.02) 45%, rgb(var(--fg) / 0.06) 100%)',
            }}
          />
          <div className="grain absolute inset-0" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ImageIcon
              className="t-fg-faint h-6 w-6"
              strokeWidth={1.25}
              aria-hidden="true"
            />
            {label && <span className="label-mono t-fg-muted">{label}</span>}
            {caption && (
              <span className="t-fg-faint max-w-[26ch] text-[0.8rem] leading-snug">
                {caption}
              </span>
            )}
          </div>

          {/* Corner ticks — reads as a framing guide, not a broken asset. */}
          <Corner className="left-3 top-3 border-l border-t" />
          <Corner className="right-3 top-3 border-r border-t" />
          <Corner className="bottom-3 left-3 border-b border-l" />
          <Corner className="bottom-3 right-3 border-b border-r" />
        </>
      )}
      {children}
    </figure>
  );
}

function Corner({ className }) {
  return (
    <span
      aria-hidden="true"
      className={`t-line pointer-events-none absolute h-4 w-4 ${className}`}
      style={{ borderColor: 'rgb(var(--fg) / 0.18)' }}
    />
  );
}
