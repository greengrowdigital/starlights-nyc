import { BOOKING, CONTACT } from '../config';
import { findService, hasFromPrice } from '../data/services';
import { dateKey, longDate, money, parseDateKey } from './format';

/* -------------------------------------------------------------------------
   Calendar
   ------------------------------------------------------------------------- */

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const earliestDate = () => {
  const d = startOfToday();
  d.setDate(d.getDate() + BOOKING.leadTimeDays);
  return d;
};

export const latestDate = () => {
  const d = startOfToday();
  d.setDate(d.getDate() + BOOKING.horizonDays);
  return d;
};

export const isBookable = (date) => {
  if (!date) return false;
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  if (day < earliestDate() || day > latestDate()) return false;
  return BOOKING.openDays.includes(day.getDay());
};

/**
 * A six-row month grid, Sunday-first, padded with the neighbouring months'
 * days so the calendar never changes height between months (no layout shift
 * when you page forward — the whole booking card would jump otherwise).
 */
export function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const offset = first.getDay();
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(year, month, 1 + (i - offset));
    cells.push({
      date,
      key: dateKey(date),
      inMonth: date.getMonth() === month,
      bookable: isBookable(date),
    });
  }
  return cells;
}

/* -------------------------------------------------------------------------
   Pricing
   ------------------------------------------------------------------------- */

export const totalFor = (ids = []) =>
  ids.reduce((sum, id) => {
    const service = findService(id);
    return sum + (service ? service.price : 0);
  }, 0);

/* -------------------------------------------------------------------------
   Delivery
   ------------------------------------------------------------------------- */

/** Plain-text summary — the same body for the webhook, the SMS and the email. */
export function summarize(request, lang = 'en') {
  const lines = [];
  lines.push('STARLIGHTS.NYC — install request');
  lines.push('');

  const services = request.services
    .map((id) => {
      const service = findService(id);
      if (!service) return null;
      const label = (service[lang] || service.en).name;
      // "from" items are marked here too: the shop reads this text, and a
      // starting price that looks exact is how a quote turns into an argument.
      const prefix = service.from ? (lang === 'es' ? 'desde ' : 'from ') : '';
      return `• ${label} — ${prefix}${money(service.price, lang)}`;
    })
    .filter(Boolean);

  lines.push(...services);
  lines.push('');
  const approx = hasFromPrice(request.services);
  lines.push(
    `Estimate: ${approx ? 'from ' : ''}${money(totalFor(request.services), lang)}`,
  );

  // request.date is a "YYYY-MM-DD" calendar day, not an instant — parsed back
  // in local time so the summary never names the day before the one tapped.
  const day = parseDateKey(request.date);
  if (day) {
    lines.push(
      `Drop-off: ${longDate(day, lang)}${request.time ? ` · ${request.time}` : ''}`,
    );
  }

  lines.push('');
  lines.push(`Name: ${request.name}`);
  lines.push(`Phone: ${request.phone}`);
  if (request.email) lines.push(`Email: ${request.email}`);
  if (request.vehicle) lines.push(`Vehicle: ${request.vehicle}`);
  if (request.notes) lines.push(`Notes: ${request.notes}`);

  return lines.join('\n');
}

export const smsHref = (request, lang = 'en') => {
  // iOS wants `&body=`, Android wants `?body=`. `?` works on both when the
  // href carries no other query parameter, which is the case here.
  const body = encodeURIComponent(summarize(request, lang));
  return `${CONTACT.smsHref}?body=${body}`;
};

export const mailtoHref = (request, lang = 'en') => {
  const subject = encodeURIComponent('Install request — STARLIGHTS.NYC');
  const body = encodeURIComponent(summarize(request, lang));
  return `${CONTACT.emailHref}?subject=${subject}&body=${body}`;
};

/**
 * Send the request.
 *
 * Three delivery paths, tried in order of how much they are worth:
 *  1. /api/book — writes a real booking onto the shop's Cal.com calendar, so
 *     the slot is held and Cal sends its own confirmations.
 *  2. VITE_BOOKING_ENDPOINT — an optional webhook (n8n, Zapier, a sheet).
 *  3. Nothing — the confirmation screen then says so plainly and hands the
 *     customer a one-tap SMS/email carrying the same summary.
 *
 * The one case that is NOT a fallback is a slot someone else took while this
 * customer was filling in their details. Quietly dropping to SMS there would
 * leave them believing they hold a time that is gone, so it is returned as a
 * distinct outcome for the form to act on.
 */
export async function submitBooking(request, lang = 'en') {
  const payload = {
    ...request,
    total: totalFor(request.services),
    summary: summarize(request, lang),
    language: lang,
    source: 'starlights.nyc',
    submittedAt: new Date().toISOString(),
  };

  // 1. The calendar itself, when the chosen slot carries a real instant.
  if (request.slotStart) {
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, start: request.slotStart }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        return { ok: true, delivered: true, booked: true, uid: data?.uid || null, payload };
      }

      if (response.status === 409) {
        return { ok: false, reason: 'slot_taken', payload };
      }
      // 503 means Cal is not configured on this deploy; anything else is an
      // outage. Either way, fall through to the paths below.
    } catch {
      // Offline or no /api here — fall through.
    }
  }

  // 2. The optional webhook.
  if (BOOKING.endpoint) {
    try {
      const response = await fetch(BOOKING.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { ok: true, delivered: response.ok, payload };
    } catch {
      // A dead webhook must never cost us the lead.
    }
  }

  // 3. Nothing reached the shop — the confirmation screen will say so.
  return { ok: true, delivered: false, payload };
}

/* -------------------------------------------------------------------------
   Validation
   ------------------------------------------------------------------------- */

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

// Ten digits or more, ignoring the punctuation people actually type.
export const isPhone = (value) => value.replace(/\D/g, '').length >= 10;
