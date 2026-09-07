import { VERSION, cal, configured, eventTypeId, fail, SHOP_TZ } from './_cal.js';

/**
 * POST /api/book
 *
 * Puts a real booking on the shop's Cal.com calendar. The body is the install
 * request the site's own three-step form collected:
 *
 *   { start, name, phone, email, vehicle, notes, summary, total, language }
 *
 * `start` is the exact ISO instant that /api/slots handed out, so the slot the
 * customer tapped is the slot that gets booked no matter where they are.
 *
 * Two failure modes are told apart on purpose, because they need different
 * things from the customer:
 *  - `slot_taken`  — somebody booked it first; pick another time.
 *  - anything else — we could not reach the calendar; the confirmation screen
 *    falls back to its one-tap SMS/email, so the lead is never lost.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');
  if (!configured()) return fail(res, 503, 'not_configured');

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body) return fail(res, 400, 'bad_body');

  const { start, name, phone, email, vehicle, notes, summary, total, language } = body;

  if (!start || Number.isNaN(Date.parse(start))) return fail(res, 400, 'bad_start');
  if (!name || String(name).trim().length < 2) return fail(res, 400, 'bad_name');
  if (!phone || String(phone).replace(/\D/g, '').length < 10) return fail(res, 400, 'bad_phone');

  // Cal requires an attendee email. Customers may leave it blank on our form —
  // phone is the channel this shop actually uses — so fall back to the shop's
  // own inbox, and keep the real phone number in the booking notes either way.
  const attendeeEmail =
    email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())
      ? String(email).trim()
      : process.env.CAL_FALLBACK_EMAIL || 'nycstarlights@gmail.com';

  const detail = [
    summary || '',
    '',
    `Phone: ${phone}`,
    vehicle ? `Vehicle: ${vehicle}` : '',
    notes ? `Customer notes: ${notes}` : '',
    email ? '' : '(No email given — contact by phone.)',
    'Booked from starlights.nyc',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 4000);

  try {
    const result = await cal('POST', '/bookings', {
      version: VERSION.bookings,
      body: {
        start,
        eventTypeId: eventTypeId(),
        attendee: {
          name: String(name).trim().slice(0, 120),
          email: attendeeEmail,
          phoneNumber: String(phone).trim().slice(0, 40),
          timeZone: SHOP_TZ,
          language: language === 'es' ? 'es' : 'en',
        },
        bookingFieldsResponses: {
          title: vehicle ? `Install — ${String(vehicle).slice(0, 80)}` : 'Install request',
          notes: detail,
        },
        metadata: {
          source: 'starlights.nyc',
          // Cal's metadata values are strings.
          estimate: total != null ? String(total) : '',
        },
      },
    });

    if (!result.ok) {
      const text = (result.text || '').toLowerCase();
      const taken =
        result.status === 400 &&
        /no longer available|already booked|slot|not available/.test(text);
      console.error('cal booking failed', result.status, result.text?.slice(0, 400));
      return fail(res, taken ? 409 : 502, taken ? 'slot_taken' : 'upstream');
    }

    const booking = result.json?.data || {};
    return res.status(200).json({
      ok: true,
      delivered: true,
      uid: booking.uid || null,
      start: booking.start || start,
    });
  } catch (error) {
    console.error('cal booking threw', error?.message);
    return fail(res, 502, 'upstream');
  }
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
