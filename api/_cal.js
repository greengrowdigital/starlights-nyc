/**
 * Cal.com API client — server side only.
 *
 * This file lives under /api and is prefixed with an underscore, so Vercel
 * treats it as a shared module rather than a route. The API key is read from
 * `process.env.CAL_API_KEY`, which exists only on the server: a key with a
 * VITE_ prefix would be inlined into the public JavaScript bundle by Vite, and
 * anyone could read it out of the deployed site.
 *
 * The v1 API is gone (410). Everything here is v2, which versions each family
 * of endpoints separately via the `cal-api-version` header.
 */

export const CAL_BASE = 'https://api.cal.com/v2';

export const VERSION = {
  eventTypes: '2024-06-14',
  slots: '2024-09-04',
  bookings: '2024-08-13',
};

/** The shop's own clock. A drop-off time only means anything in shop-local time. */
export const SHOP_TZ = process.env.CAL_TIMEZONE || 'America/New_York';

export const eventTypeId = () => Number(process.env.CAL_EVENT_TYPE_ID || 0);

export function configured() {
  return Boolean(process.env.CAL_API_KEY && eventTypeId());
}

export async function cal(method, path, { version, body, signal } = {}) {
  const headers = { Authorization: `Bearer ${process.env.CAL_API_KEY}` };
  if (version) headers['cal-api-version'] = version;
  if (body) headers['Content-Type'] = 'application/json';

  const response = await fetch(CAL_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Cal occasionally answers with a plain-text error body.
  }

  return { ok: response.ok, status: response.status, json, text };
}

/**
 * "9:00 AM" in the shop's timezone, from an absolute instant.
 *
 * Formatting server-side keeps every visitor looking at the same clock — the
 * one they will actually drive to — instead of their own.
 */
export function shopTime(iso) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: SHOP_TZ,
  }).format(new Date(iso));
}

/** "YYYY-MM-DD" for an instant, in the shop's timezone. */
export function shopDay(iso) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: SHOP_TZ,
  }).format(new Date(iso));
}

/** Never let an upstream error body reach the browser — it can echo the key. */
export function fail(res, status, reason) {
  res.status(status).json({ ok: false, reason });
}
