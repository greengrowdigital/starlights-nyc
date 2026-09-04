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

### `mode: 'calcom'`

Swaps step two for a real Cal.com calendar. Two lines, no npm install — the
embed script is fetched at runtime only in this mode:

```js
// src/config.js
export const BOOKING = {
  mode: 'calcom',
  calcom: { link: 'starlights-nyc/install', theme: 'dark' },
  …
}
```

or set `VITE_CALCOM_LINK` in the environment.

---

## Prices

All prices live in **one file**: `src/data/services.js`. Each row carries its
own English and Spanish copy next to its price, so a translation can never
drift from the item it describes. Changing a price there updates the product
cards, the configurators, the booking summary and the SMS/email body.

| Item | Price |
|---|---|
| Starlight ceiling — 550 stars | $695 |
| Starlight ceiling — 800 stars | $850 |
| Starlight ceiling — 1,100 stars | $1,050 |
| Shooting stars (10-star set) | $275 |
| Suede headliner — Coupe | $400 |
| Suede headliner — Sedan | $600 |
| Suede headliner — SUV | $700 |
| A / B / C pillars | $50 each |
| Flow Series ambient lighting | $500 |

---

## Language

Bilingual EN/ES with a toggle in the nav, persisted to `localStorage`.

**English is the primary language.** A first-time visitor always lands in
English regardless of their browser locale; Spanish appears only because
someone chose it. All UI copy is in `src/i18n/dictionary.js`.

---

## Adding photography

The client's photos are not in yet, so every image position renders as a
deliberate, on-brand plate — never a stock photo of somebody else's car.

Each slot already reserves its exact aspect ratio, so **dropping in real photos
cannot shift the layout**. To fill one, pass `src` and a real `alt`:

```jsx
<Placeholder ratio="16 / 10" src="/photos/ceiling-01.jpg" alt="Starlight ceiling in a BMW 4 Series" />
```

Slots waiting on photography:

- `src/sections/Gallery.jsx` — five slots, one hero frame + one vertical + three supporting
- `src/sections/Headliner.jsx` — one suede close-up

The **logo** goes in `public/` and replaces the `StarMark` SVG in
`src/components/Nav.jsx` (and, if wanted, `public/favicon.svg`).

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
  loader is skipped, the starfield renders one static frame and never starts a
  loop, every entrance renders in its final state, and the scroll-linked
  effects collapse to their resting values.
- The starfield loop is stopped by an `IntersectionObserver` whenever its canvas
  leaves the viewport.

---

## Deploy

Vercel, framework preset **Vite**, build `npm run build`, output `dist`.
`vercel.json` already contains the SPA rewrite. No environment variables are
required; add `VITE_BOOKING_ENDPOINT` only if the shop wants requests captured
server-side.

---

## Contact (client)

- **Phone / text** 347-613-2707
- **Email** Nycstarlights@gmail.com
- **Instagram / TikTok** @starlights.nyc
