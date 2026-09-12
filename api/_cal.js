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

/** The stable name of the event type. Survives the id changing. */
export const EVENT_SLUG = process.env.CAL_EVENT_TYPE_SLUG || 'install';

export function configured() {
  return Boolean(process.env.CAL_API_KEY);
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

/* -------------------------------------------------------------------------
   Which event type are we booking?

   The id used to be read straight from CAL_EVENT_TYPE_ID. That broke: the
   event type was deleted in the Cal dashboard, every id-based call started
   answering 404, and the site quietly fell back to its static schedule for
   days without anyone noticing.

   So the id is now a hint, not the source of truth. The slug is. The happy
   path still costs nothing — the configured id is used directly — but the
   moment Cal says "Event Type not found", the routes call `refreshEventType`,
   which looks the slug up and carries on with whatever id it has today.
   ------------------------------------------------------------------------- */

let cachedId = null;

export function eventTypeId() {
  return cachedId || Number(process.env.CAL_EVENT_TYPE_ID || 0) || null;
}

/** True when Cal is telling us the id we hold no longer exists. */
export function isMissingEventType(result) {
  if (!result || result.status !== 404) return false;
  return /event type not found/i.test(result.text || '');
}

/**
 * Re-resolve the event type by slug and cache it for this warm instance.
 * Returns the id, or null when the account has no event types at all — in
 * which case the caller should degrade rather than retry.
 */
export async function refreshEventType() {
  const result = await cal('GET', '/event-types', { version: VERSION.eventTypes });
  const list = result.json?.data;
  if (!Array.isArray(list) || list.length === 0) {
    console.error('cal: account has no event types; cannot resolve', EVENT_SLUG);
    cachedId = null;
    return null;
  }

  const match = list.find((e) => e.slug === EVENT_SLUG) || list[0];
  cachedId = match?.id || null;
  if (cachedId && String(cachedId) !== String(process.env.CAL_EVENT_TYPE_ID)) {
    // Loud on purpose: the env var is now stale and should be updated, even
    // though the site keeps working without it.
    console.warn(
      `cal: CAL_EVENT_TYPE_ID is stale (env=${process.env.CAL_EVENT_TYPE_ID}, live=${cachedId} for slug "${EVENT_SLUG}")`,
    );
  }
  return cachedId;
}

/**
 * Run a Cal call that depends on the event type id, retrying once against a
 * freshly resolved id if the first attempt says the event type is gone.
 * `run` receives the id and returns the result of `cal(...)`.
 */
export async function withEventType(run) {
  let id = eventTypeId();
  if (!id) {
    id = await refreshEventType();
    if (!id) return { ok: false, status: 503, json: null, text: 'no_event_type' };
  }

  let result = await run(id);
  if (isMissingEventType(result)) {
    const fresh = await refreshEventType();
    if (fresh && fresh !== id) result = await run(fresh);
  }
  return result;
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
