const LOCALES = { en: 'en-US', es: 'es-US' };

export const money = (value, lang = 'en') =>
  new Intl.NumberFormat(LOCALES[lang] || 'en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const number = (value, lang = 'en') =>
  new Intl.NumberFormat(LOCALES[lang] || 'en-US').format(value);

/** "Thursday, March 14" — the way a customer would say a drop-off day. */
export const longDate = (date, lang = 'en') =>
  new Intl.DateTimeFormat(LOCALES[lang] || 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);

export const monthLabel = (date, lang = 'en') =>
  new Intl.DateTimeFormat(LOCALES[lang] || 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);

/**
 * Two-letter weekday initials for the calendar header, Sunday first.
 *
 * The seed dates are built in LOCAL time on purpose. Date.UTC here would put
 * the header one day out of step with the grid for every viewer west of UTC,
 * because Intl formats in the local zone: midnight UTC on a Sunday is still
 * Saturday evening in New York.
 */
export const weekdayInitials = (lang = 'en') => {
  const fmt = new Intl.DateTimeFormat(LOCALES[lang] || 'en-US', { weekday: 'short' });
  // 2024-01-07 was a Sunday; walking seven days gives a locale-correct header.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 7 + i)).slice(0, 2));
};

/**
 * Date-only key, local time, safe to compare and to send to a webhook.
 *
 * A drop-off day is a calendar day, not an instant. Sending `toISOString()`
 * would shift local midnight into the previous UTC day for anyone east of
 * Greenwich, so the shop would receive a booking for the day before the one
 * the customer tapped.
 */
export const dateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Inverse of dateKey. Must not go through `new Date('2026-09-14')`, which the
 * spec parses as UTC midnight — that renders as the 13th anywhere west of
 * Greenwich, i.e. for every customer this shop actually has.
 */
export const parseDateKey = (key) => {
  if (!key) return null;
  const [y, m, d] = String(key).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

export const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
