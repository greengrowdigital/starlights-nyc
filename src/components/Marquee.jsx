/**
 * Hairline marquee that separates the hero from the story. Two identical
 * tracks slide as one 50%-wide loop, so the seam never lands where you can
 * see it. Duplicated content is hidden from assistive tech.
 */
export default function Marquee({ items = [], className = '' }) {
  const track = [...items, ...items];

  return (
    <div
      className={`t-line relative overflow-hidden border-y py-4 ${className}`}
      aria-hidden="true"
    >
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {track.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-10">
            <span className="label-mono t-fg-muted">{item}</span>
            <Star />
          </span>
        ))}
      </div>

      {/* Feather both ends into the background so the loop has no hard edge. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28"
        style={{ background: 'linear-gradient(to right, rgb(var(--bg)), transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28"
        style={{ background: 'linear-gradient(to left, rgb(var(--bg)), transparent)' }}
      />
    </div>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 12 12" className="h-2 w-2 shrink-0" fill="currentColor">
      <path
        d="M6 0l1.2 4.8L12 6l-4.8 1.2L6 12l-1.2-4.8L0 6l4.8-1.2z"
        style={{ fill: 'rgb(var(--fg) / 0.35)' }}
      />
    </svg>
  );
}
