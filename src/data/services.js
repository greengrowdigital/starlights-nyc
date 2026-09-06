/**
 * The full STARLIGHTS.NYC price list.
 *
 * Copy lives next to its price on purpose: a translation can never drift away
 * from the row it describes, and the client changes both in one place. UI
 * chrome (buttons, labels, headlines) lives in src/i18n/dictionary.js instead.
 *
 * `from: true` marks a price that is a starting point rather than the figure
 * the customer will pay. Everything that renders a price checks the flag and
 * prefixes it, so a "from" price can never be shown as if it were exact — in
 * the booking summary, the estimate, or the text message the shop receives.
 *
 * Prices last confirmed with the shop 2026-09-05.
 */

export const STAR_KITS = [
  {
    id: 'stars-550',
    stars: 550,
    price: 719,
    // Density used by the live starfield preview, not a sales number.
    en: { name: '550 Stars', note: 'The clean night. Even, calm, unmistakably custom.' },
    es: { name: '550 Estrellas', note: 'La noche limpia. Pareja, tranquila, inconfundiblemente custom.' },
  },
  {
    id: 'stars-800',
    stars: 800,
    price: 850,
    en: { name: '800 Stars', note: 'Our most requested. Depth without noise.' },
    es: { name: '800 Estrellas', note: 'La más pedida. Profundidad sin ruido.' },
  },
  {
    id: 'stars-1100',
    stars: 1100,
    price: 1199,
    en: { name: '1,100 Stars', note: 'Full galaxy. Edge to edge, pillar to pillar.' },
    es: { name: '1,100 Estrellas', note: 'Galaxia completa. De borde a borde, de pilar a pilar.' },
  },
];

export const SHOOTING_STARS = {
  id: 'shooting-10',
  price: 275,
  count: 10,
  en: { name: 'Shooting Stars — 10-Star Set', note: 'Ten timed streaks that cross the ceiling on their own.' },
  es: { name: 'Estrellas Fugaces — Set de 10', note: 'Diez trazos programados que cruzan el techo solos.' },
};

/**
 * Galaxy glass. The price covers material and labour, and starts from the
 * glass in the vehicle — a panoramic roof is not one size, so this is the only
 * item on the list that cannot be quoted exactly from a web page.
 */
export const GALAXY_GLASS = {
  id: 'galaxy-glass',
  price: 999,
  from: true,
  en: {
    name: 'Galaxy Glass',
    note: 'Your panoramic roof, turned into a night sky. Material and labour included.',
  },
  es: {
    name: 'Galaxy Glass',
    note: 'Tu techo panorámico, convertido en cielo nocturno. Material y mano de obra incluidos.',
  },
};

export const HEADLINER = [
  {
    id: 'suede-coupe',
    price: 400,
    en: { name: 'Coupe', note: 'Two doors, one continuous panel.' },
    es: { name: 'Coupé', note: 'Dos puertas, un solo panel continuo.' },
  },
  {
    id: 'suede-sedan',
    price: 600,
    en: { name: 'Sedan', note: 'Front and rear, seams hidden in the pillars.' },
    es: { name: 'Sedán', note: 'Adelante y atrás, costuras escondidas en los pilares.' },
  },
  {
    id: 'suede-suv',
    price: 700,
    en: { name: 'SUV', note: 'Full cabin, including the third row where fitted.' },
    es: { name: 'SUV', note: 'Cabina completa, incluida la tercera fila si la trae.' },
  },
];

export const PILLARS = [
  { id: 'pillar-a', price: 50, en: { name: 'A-Pillars' }, es: { name: 'Pilares A' } },
  { id: 'pillar-b', price: 50, en: { name: 'B-Pillars' }, es: { name: 'Pilares B' } },
  { id: 'pillar-c', price: 50, en: { name: 'C-Pillars' }, es: { name: 'Pilares C' } },
];

export const FLOW = {
  id: 'flow-series',
  price: 599,
  en: {
    name: 'Flow Series Ambient Lighting',
    note: 'One system, sixteen million colors, controlled from your phone or your voice.',
  },
  es: {
    name: 'Iluminación Ambiental Flow Series',
    note: 'Un sistema, dieciséis millones de colores, controlado desde tu teléfono o tu voz.',
  },
};

export const FLOW_INCLUDES = [
  {
    id: 'flow-dash',
    en: { name: 'Full dashboard lighting' },
    es: { name: 'Iluminación completa del tablero' },
  },
  {
    id: 'flow-doors',
    en: { name: '2 or 4 door lighting', sub: 'Vehicle dependent' },
    es: { name: 'Iluminación en 2 o 4 puertas', sub: 'Según el vehículo' },
  },
  {
    id: 'flow-footwell',
    en: { name: 'Front footwell lighting' },
    es: { name: 'Iluminación de pisos delanteros' },
  },
  {
    id: 'flow-app',
    en: { name: 'App controlled' },
    es: { name: 'Control por app' },
  },
  {
    id: 'flow-voice',
    en: { name: 'Voice controlled' },
    es: { name: 'Control por voz' },
  },
  {
    id: 'flow-switch',
    en: { name: 'Easy-access switch', sub: 'Optional' },
    es: { name: 'Switch de acceso rápido', sub: 'Opcional' },
  },
];

/**
 * Everything the booking flow can put in a cart, flattened, with the section
 * it belongs to. Keeping this derived means a price is only ever written once.
 */
export const BOOKABLE = [
  ...STAR_KITS.map((s) => ({ ...s, group: 'starlight' })),
  { ...SHOOTING_STARS, group: 'starlight' },
  { ...GALAXY_GLASS, group: 'starlight' },
  ...HEADLINER.map((s) => ({ ...s, group: 'headliner' })),
  ...PILLARS.map((s) => ({ ...s, group: 'headliner' })),
  { ...FLOW, group: 'flow' },
];

export const findService = (id) => BOOKABLE.find((s) => s.id === id);

/** True when the cart holds anything quoted from a starting price. */
export const hasFromPrice = (ids = []) =>
  ids.some((id) => {
    const service = findService(id);
    return Boolean(service && service.from);
  });
