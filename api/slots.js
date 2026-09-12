import {
  SHOP_TZ,
  VERSION,
  cal,
  configured,
  fail,
  shopDay,
  shopTime,
  withEventType,
} from './_cal.js';

/**
 * GET /api/slots?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * The shop's real availability for a date range, grouped by day:
 *
 *   { ok: true, timeZone: "America/New_York",
 *     days: { "2026-09-08": [{ label: "9:00 AM", start: "2026-09-08T09:00:00.000-04:00" }] } }
 *
 * Both halves matter. `label` is what the customer reads, formatted in the
 * shop's timezone; `start` is the exact instant handed back to Cal at booking
 * time, so a customer in another timezone can never book an hour they did not
 * mean.
 *
 * When Cal is not configured this answers 200 with `configured: false` rather
 * than an error — the booking form then keeps its built-in schedule, and the
 * site still works with no Cal account at all.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

  if (!configured()) {
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(200).json({ ok: true, configured: false, days: {} });
  }

  const { start, end } = req.query || {};
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(String(start)) || !iso.test(String(end))) {
    return fail(res, 400, 'bad_range');
  }

  // A month at a time is the most the calendar ever shows; anything larger is
  // someone probing the endpoint.
  const span = (new Date(end) - new Date(start)) / 86400000;
  if (!(span >= 0 && span <= 62)) return fail(res, 400, 'bad_range');

  try {
    // withEventType retries once against a freshly resolved id if the one we
    // hold has been deleted in the Cal dashboard — see api/_cal.js.
    const result = await withEventType((eventTypeId) => {
      const query = new URLSearchParams({
        eventTypeId: String(eventTypeId),
        start,
        end,
        timeZone: SHOP_TZ,
      });
      return cal('GET', `/slots?${query}`, { version: VERSION.slots });
    });

    if (!result.ok) {
      // Log server-side for us; tell the browser nothing but that it failed.
      console.error('cal slots failed', result.status, result.text?.slice(0, 300));
      return fail(res, 502, 'upstream');
    }

    const raw = result.json?.data || {};
    const days = {};
    for (const [, list] of Object.entries(raw)) {
      for (const slot of list || []) {
        if (!slot?.start) continue;
        // Re-derive the day from the instant rather than trusting Cal's key,
        // so the grouping always agrees with the label beside it.
        const day = shopDay(slot.start);
        (days[day] ||= []).push({ label: shopTime(slot.start), start: slot.start });
      }
    }

    // Availability changes as people book; a short edge cache keeps a burst of
    // month-flipping off Cal's rate limit without ever showing a stale day for
    // long. Cal re-checks the slot at booking time regardless.
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ ok: true, configured: true, timeZone: SHOP_TZ, days });
  } catch (error) {
    console.error('cal slots threw', error?.message);
    return fail(res, 502, 'upstream');
  }
}
