import { BOOKING } from '../config';
import { dateKey } from './format';
import { isBookable } from './booking';

/**
 * Where the booking calendar gets its days and times.
 *
 * When the site is deployed with Cal.com configured, /api/slots answers with
 * the shop's real availability and this module simply passes it through. When
 * it is not — a local `vite preview` with no serverless functions, a Cal
 * outage, a deploy before the env vars are set — it falls back to the fixed
 * schedule in src/config.js, which is what the form used before Cal existed.
 *
 * The fallback is the point. A booking form that shows an error because a
 * calendar API is down is worse than one that shows a sensible schedule and
 * lets the shop confirm by text.
 */

/** Slots for one day, from the static schedule, with past times dropped. */
function staticSlots(date) {
  const isToday = dateKey(date) === dateKey(new Date());
  const now = new Date();
  return BOOKING.timeSlots
    .filter((label) => {
      if (!isToday) return true;
      const [clock, meridiem] = label.split(' ');
      const [h, m] = clock.split(':').map(Number);
      const hour = (h % 12) + (meridiem === 'PM' ? 12 : 0);
      return hour > now.getHours() || (hour === now.getHours() && m > now.getMinutes());
    })
    .map((label) => ({ label, start: null }));
}

/**
 * Fetch a month of availability.
 *
 * Resolves to `{ live, days }`. `live` says whether the answer came from Cal;
 * the caller uses it to decide whether an empty day means "closed" or just
 * "we could not ask". Never rejects — a failure is a fallback, not an error.
 */
export async function fetchAvailability(start, end, { signal } = {}) {
  try {
    const query = new URLSearchParams({ start: dateKey(start), end: dateKey(end) });
    const response = await fetch(`/api/slots?${query}`, { signal });
    if (!response.ok) return { live: false, days: {} };

    const data = await response.json();
    if (!data?.ok || !data.configured) return { live: false, days: {} };
    return { live: true, days: data.days || {}, timeZone: data.timeZone };
  } catch {
    // Aborted, offline, or no /api in this environment.
    return { live: false, days: {} };
  }
}

/** Can this day be chosen? Cal decides when it answered; config decides otherwise. */
export function dayIsOpen(date, availability) {
  if (availability?.live) {
    return (availability.days[dateKey(date)] || []).length > 0;
  }
  return isBookable(date);
}

/** The times to offer for a chosen day, as `{ label, start }`. */
export function slotsForDay(date, availability) {
  if (!date) return [];
  if (availability?.live) return availability.days[dateKey(date)] || [];
  return staticSlots(date);
}
