/**
 * STARLIGHTS.NYC — single source of truth for everything the client may want
 * to change without touching a component: contact details, shop hours, and how
 * a booking actually gets delivered.
 */

export const CONTACT = {
  phone: '347-613-2707',
  phoneHref: 'tel:+13476132707',
  smsHref: 'sms:+13476132707',
  email: 'Nycstarlights@gmail.com',
  emailHref: 'mailto:Nycstarlights@gmail.com',
  instagram: 'starlights.nyc',
  instagramHref: 'https://instagram.com/starlights.nyc',
  tiktok: 'starlights.nyc',
  tiktokHref: 'https://www.tiktok.com/@starlights.nyc',
  city: 'New York City',
};

/**
 * Booking delivery.
 *
 * mode: 'native'  — the built-in 3-step flow in src/sections/Booking.jsx.
 *                   Requests are POSTed to `endpoint` when one is configured;
 *                   with no endpoint the flow still completes and hands the
 *                   customer a prefilled SMS/email, so the site is useful the
 *                   moment it is deployed, with zero API keys.
 * mode: 'calcom'  — replaces the date/time step with a Cal.com inline embed.
 *                   Set `calcom.link` to the booking link ("user/event") and
 *                   the embed script is lazy-loaded only in that mode. No npm
 *                   dependency, no key.
 */
export const BOOKING = {
  /**
   * 'native' keeps the site's own three-step flow. That is the right mode even
   * with Cal.com connected: the form knows what the visitor configured while
   * scrolling, and an iframe would throw that away. Cal is wired in behind it
   * — /api/slots supplies the real availability and /api/book writes the real
   * booking — so the shop still sees everything in its Cal dashboard.
   *
   * 'calcom' swaps step two for the Cal embed instead. Kept for the case where
   * the shop would rather manage the whole booking screen from Cal.
   */
  mode: 'native',

  // Optional webhook (n8n, Zapier, Formspree, a serverless route...). When set,
  // the request payload is POSTed here as JSON before the confirmation screen.
  endpoint: import.meta.env.VITE_BOOKING_ENDPOINT || '',

  // Only read when mode === 'calcom'. The API key is NOT here on purpose:
  // anything with a VITE_ prefix is inlined into the public bundle. The key
  // lives in CAL_API_KEY, server-side, read by /api/*.
  calcom: {
    link: import.meta.env.VITE_CALCOM_LINK || 'nycstarlights/install',
    theme: 'dark',
  },

  /**
   * Fallback schedule, used only when /api/slots cannot answer — a local
   * preview with no serverless functions, or a Cal outage. When Cal responds,
   * its availability wins and these values are ignored entirely, so the shop
   * changes its hours in Cal.com and not here.
   *
   * 0 = Sunday ... 6 = Saturday
   */
  openDays: [1, 2, 3, 4, 5, 6],
  timeSlots: ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'],

  // How far out the customer can book, and how much lead time we require.
  leadTimeDays: 0, // 0 = same-day slots are offered
  horizonDays: 45,
};

// Brand constants only. Anything a visitor reads lives in src/i18n/dictionary.js
// so it can be translated — the warranty line used to sit here and shipped in
// English on the Spanish page.
export const SITE = {
  name: 'STARLIGHTS.NYC',
};
