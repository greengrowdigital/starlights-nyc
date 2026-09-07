# STARLIGHTS.NYC

Single-scroll landing page for STARLIGHTS.NYC — premium automotive interior
customization in New York. Starlight ceilings, suede headliner wraps and
Flow Series ambient lighting, with a built-in install booking flow.

Built by **GreenGrow Digital**.

---

## Stack

| | |
|---|---|
| Build | Vite 6 |
| UI | React 19 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, no config file — theme lives in `src/index.css`) |
| Motion | Framer Motion 11 |
| Icons | lucide-react |
| Hosting | Vercel (`vercel.json` included, SPA rewrites) |

No API keys are required to run or deploy this site.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview
```

---

## How the page works

It is **one scroll**, in ten acts. `src/App.jsx` is the running order:

| # | Section | Theme | What it does |
|---|---------|-------|--------------|
| 1 | Hero | dark | Live canvas starfield, the headline, the two CTAs |
| 2 | Manifesto | light | Statement written line-by-line by the scroll |
| 3 | Starlight | dark | The three kits + a **live ceiling preview** |
| 4 | ShootingStars | dark | The add-on, shown moving |
| 5 | Headliner | light | Vehicle picker + interactive pillar diagram |
| 6 | FlowSeries | dark | Ambient cabin demo with colour swatches |
| 7 | Why | smoke | Four reasons to trust the shop |
| 8 | Gallery | dark | Photo slots (see *Adding photography*) |
| 9 | Booking | light | Three-step install request |
| 10 | Footer | dark | Call · Text · Email · Follow |

### The background morph

The page does not stack black and white bands — it interpolates between them.

Every section declares `data-theme="dark" | "light" | "smoke"`.
`src/hooks/useScrollTheme.jsx` measures where those sections sit and, on every
animation frame of scroll, writes an interpolated pair of RGB triples onto
`<html>`:

```css
:root { --bg: 0 0 0; --fg: 255 255 255; }
```

Everything else reads those two variables through the utilities in
`src/index.css` (`t-bg`, `t-fg`, `t-fg-55`, `t-line`, `t-surface`, `btn-invert`…).
**No component hardcodes black or white.** That is why the nav, the borders and
the buttons all invert continuously instead of flipping at a breakpoint.

To reorder the light, reorder the sections in `App.jsx` — nothing else changes.

> Custom utilities are declared with Tailwind v4's `@utility` (not inside
> `@layer utilities`) specifically so variants work: `hover:t-fg`, `sm:t-surface`.

---

## Booking

`src/config.js` → `BOOKING.mode` decides how the second step behaves.

### `mode: 'native'` (default)

The built-in three-step flow: **Service → Date & time → Details**. It ships
working, with no account to create and no key to paste:

- Availability comes from `BOOKING.openDays`, `BOOKING.timeSlots`,
  `leadTimeDays` and `horizonDays`. Same-day slots already in the past are
  hidden automatically.
- Anything the visitor configured while scrolling (a ceiling kit, a headliner,
  pillars, Flow Series) is already ticked when they reach the form.
- On submit, the request is POSTed to `VITE_BOOKING_ENDPOINT` **if one is set**.
- Either way the confirmation screen hands the customer a one-tap **Send as
  text** and **Send as email**, prefilled with the identical summary the webhook
  receives. A missing or broken webhook can never cost the shop a lead.

To capture requests server-side, point the env var at any URL that accepts JSON
(n8n, Zapier, Formspree, a Vercel function):

```bash
VITE_BOOKING_ENDPOINT="https://…/webhook/starlights-booking"
```

Payload shape:

```json
{
  "services": ["stars-800", "suede-sedan", "pillar-a"],
  "date": "2026-09-14T00:00:00.000Z",
  "time": "11:00 AM",
  "name": "…", "phone": "…", "email": "…", "vehicle": "…", "notes": "…",
  "total": 1500,
  "summary": "plain-text version of the whole request",
  "language": "en",
  "source": "starlights.nyc",
  "submittedAt": "…"
}
```

### Cal.com (connected)

The shop's calendar is live behind the native flow — the form keeps its own
three steps, and Cal supplies the availability and receives the booking.

| | |
|---|---|
| Account | `nycstarlights` (nycstarlights@gmail.com) |
| Event type | **Starlight Install — Drop-off**, id `6967171`, slug `install`, 120 min |
| Timezone | `America/New_York` |
| Hours | Set in Cal.com, not in this repo |

Two serverless functions do the talking, so the API key never reaches the
browser:

- **`GET /api/slots?start=&end=`** — the real availability for a date range,
  grouped by day as `{ label, start }`. `label` is what the customer reads,
  formatted in the shop's timezone; `start` is the exact instant handed back at
  booking time, so a customer in another timezone cannot book an hour they did
  not mean. Days with nothing free are unclickable in the calendar.
- **`POST /api/book`** — writes the booking onto the calendar, with the service
  list, estimate, vehicle and phone in the notes.

**If Cal cannot be reached** — a local `vite preview` with no functions, a
deploy before the env vars are set, an outage — the form falls back to the
fixed schedule in `src/config.js` and the SMS/email path. A booking form that
errors because a calendar API is down is worse than one that shows sensible
hours and lets the shop confirm by text.

**If someone books the slot first**, the customer is sent back to step two with
that reason rather than being told a time is theirs when it is not.

The env vars are in `.env.example`. **None of them carry a `VITE_` prefix** —
Vite inlines those into the public bundle, so a key named `VITE_CAL_API_KEY`
would be readable by anyone who opened the site.

### `mode: 'calcom'`

Still available in `src/config.js`: swaps step two for the Cal embed instead of
the site's own calendar. Kept for the case where the shop would rather manage
the whole booking screen from Cal. No npm install — the embed script is fetched
at runtime only in that mode.

---

## Prices

All prices live in **one file**: `src/data/services.js`. Each row carries its
own English and Spanish copy next to its price, so a translation can never
drift from the item it describes. Changing a price there updates the product
cards, the configurators, the booking summary and the SMS/email body.

Last confirmed with the shop **2026-09-05**.

| Item | Price |
|---|---|
| Starlight ceiling — 550 stars | $719 |
| Starlight ceiling — 800 stars | $850 |
| Starlight ceiling — 1,100 stars | $1,199 |
| Shooting stars (10-star set) | $275 |
| **Galaxy glass** | **from $999** |
| Suede headliner — Coupe | $400 |
| Suede headliner — Sedan | $600 |
| Suede headliner — SUV | $700 |
| A / B / C pillars | $50 each |
| Flow Series ambient lighting | $599 |

An item can set `from: true` in `services.js`. Every place a price is rendered
checks the flag and prefixes it — the picker row, the booking summary, the
running estimate, and the text message the shop receives — so a starting price
is never shown as if it were the final one. `hasFromPrice(ids)` reports whether
a cart contains any of them.

---

## Language

Bilingual EN/ES with a toggle in the nav, persisted to `localStorage`.

**English is the primary language.** A first-time visitor always lands in
English regardless of their browser locale; Spanish appears only because
someone chose it. All UI copy is in `src/i18n/dictionary.js`.

---

## Media

Everything the shop sent lives in `public/media/` — 11 photos (`photo-01.jpg`
… `photo-11.jpg`) and 28 clips (`clip-01.mp4` … `clip-28.mp4`), all portrait
phone footage, WhatsApp-compressed (0.2–1.5 MB per clip). `public/logo.jpeg` is
the emblem, used as the nav badge, the footer mark, the gallery's text tile and
the touch icon.

- **The reel** (`src/sections/Reel.jsx`) is a five-panel wall of clips. Each
  panel has a rotation (`PANELS`) and is double-buffered — two `<video>`s, one
  playing, one holding the next clip — so the wall never exceeds ten video
  elements and only two clips are ever in flight per panel. Nothing loads until
  the wall is first in view, and everything pauses when it leaves. Reorder or
  swap clips by editing `PANELS`.
- **The gallery** (`src/sections/Gallery.jsx`) takes its photos and captions
  from `PHOTOS`; the first entry is the 2×2 hero frame. Every frame is 3:4, so
  swapping a photo cannot shift the layout.
- **The headliner** section shows `photo-04.jpg` (a finished, lit headliner).

Unused clips ship in `public/media/` so they can be rotated in without a
re-upload; they cost nothing at runtime.

---

## Motion

The page scrolls with inertia (**Lenis**, `src/components/SmoothScroll.jsx`):
the wheel glides to a stop instead of snapping. Touch stays native. Every
programmatic scroll — nav anchors, "Book this ceiling", the confirmation
screen — goes through `src/lib/scroll.js`, so it eases the same way and falls
back to native `scrollIntoView` when Lenis is absent.

What moves, and why:

| Where | What happens | Driven by |
|---|---|---|
| **Opening** | Black. The ceiling lights one point at a time, then the brand appears in the bar, then the links, then the headline word by word, lead, buttons, scroll hint. The schedule is `src/lib/intro.js`; a second load in the same tab plays the short cut | time |
| Hero | Headline grows and softens as you leave the sky (zoom-through) | scroll |
| Manifesto | The sentence is *written* word by word, and un-written scrolling back | scroll |
| **Ceiling** | The section **pins** for three screens while the fiber fills 550 → 800 → 1,100 and the matching kit lights. Tapping a kit jumps to its beat | scroll |
| Headliner | The car **draws itself** on first sight, then **morphs** between coupe / sedan / SUV; a ticked pillar traces its stroke in | in-view + state |
| Flow Series | A tracer runs the new colour down the dash, then the doors catch, then the footwells | state |
| Gallery | Frames grow into place; the vertical one drifts against the scroll | scroll |
| Booking | Steps slide in the direction you are heading; the stepper fills | state |
| Nav | A hairline slides between links to mark the section under you | IntersectionObserver |
| Every title | Words rise out of a mask — one entrance for the whole site | in-view |

The pinned ceiling runs on Framer MotionValues read directly by the canvas and
by a `motion.span`, so the whole sequence plays **without a single React
render**. Under `max-height: 540px` (landscape phones) the pin is released and
the scene flows normally.

### The drawings

Three interactive illustrations are hand-built SVG, monochrome so they live on
either pole of the scroll:

- **`CarProfile`** (`src/components/CarProfile.jsx`) — three real silhouettes
  (coupe, sedan, SUV) with the proportions of the actual vehicles. Pillars are
  drawn as the bands of metal between the glass, so ticking one lights the
  exact part being wrapped. Body outlines morph with **flubber**; glass,
  pillars, lights and handles are fixed-count polygons Framer tweens; wheels
  move and resize. Geometry lives in `VEHICLES` — edit numbers, keep the shape.
- **`CabinDrawing`** (`src/components/CabinDrawing.jsx`) — the cabin from the
  driver's seat, with the Flow Series strips on the surfaces they follow on a
  real install: the dash seam, the door trims, the footwells. The tracer is a
  short bright segment of the dash path pushed along it with `pathOffset`;
  "Flow" mode uses an SMIL-scrolled spectrum gradient, no JS per frame.
- **The headliner** (in `Starlight.jsx` + `.headliner-*` in `index.css`) — the
  starfield is clipped to a roof panel's trim outline, with the map-light
  console, a sunroof the fiber runs around, grab handles and the dome light.

## Accessibility & motion

- Every colour is derived from `--fg`, so contrast holds on both poles of the scroll.
- `prefers-reduced-motion` is honoured throughout: Lenis is not mounted, the
  opening sequence is skipped (the sky is simply lit), the starfield renders
  one static frame and never starts a loop, every entrance renders in its
  final state, and the scroll-linked effects collapse to their resting values.
- The starfield loop is stopped by an `IntersectionObserver` whenever its canvas
  leaves the viewport.

---

## Deploy

Vercel, framework preset **Vite**, build `npm run build`, output `dist`.
Pushing to `main` deploys.

`vercel.json` carries one rewrite, and the shape of it matters:

```json
{ "source": "/((?!api/).*)", "destination": "/index.html" }
```

The negative lookahead keeps the SPA fallback away from `/api/*`. A plain
`/(.*)` catch-all swallows the serverless functions and the booking endpoints
answer with the HTML shell instead of JSON. `vercel.json` is also schema-checked
on deploy and rejects unknown keys — including `comment`, so it cannot document
that itself.

Environment variables live in Vercel → Settings → Environment Variables; see
`.env.example` for the four Cal.com ones. The site still builds and runs with
none of them set.

---

## Contact (client)

- **Phone / text** 347-613-2707
- **Email** Nycstarlights@gmail.com
- **Instagram / TikTok** @starlights.nyc
