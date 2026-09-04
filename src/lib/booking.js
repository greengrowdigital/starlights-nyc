import { BOOKING, CONTACT } from '../config';
import { findService } from '../data/services';
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
      return `• ${label} — ${money(service.price, lang)}`;
    })
    .filter(Boolean);

  lines.push(...services);
  lines.push('');
  lines.push(`Estimate: ${money(totalFor(request.services), lang)}`);

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
 * With no endpoint configured this still resolves successfully: the flow is
 * designed so the confirmation screen always hands the customer a one-tap
 * SMS/email fallback. The site is therefore useful the day it ships, and
 * wiring a webhook later changes one env var, not a component.
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

  if (!BOOKING.endpoint) {
    return { ok: true, delivered: false, payload };
  }

  try {
    const response = await fetch(BOOKING.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: true, delivered: response.ok, payload };
  } catch {
    // A dead webhook must never cost us the lead — fall through to the
    // confirmation screen with its SMS/email fallback intact.
    return { ok: true, delivered: false, payload };
  }
}

/* -------------------------------------------------------------------------
   Validation
   ------------------------------------------------------------------------- */

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

// Ten digits or more, ignoring the punctuation people actually type.
export const isPhone = (value) => value.replace(/\D/g, '').length >= 10;
