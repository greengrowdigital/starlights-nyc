import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Mail, MessageSquare } from 'lucide-react';
import Section, { SectionHead } from '../components/Section';
import Reveal from '../components/Reveal';
import CalEmbed from '../components/CalEmbed';
import { BOOKING, CONTACT } from '../config';
import {
  FLOW,
  GALAXY_GLASS,
  HEADLINER,
  PILLARS,
  SHOOTING_STARS,
  STAR_KITS,
  findService,
  hasFromPrice,
} from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import { useBooking } from '../hooks/useBooking';
import {
  buildMonth,
  earliestDate,
  isEmail,
  isPhone,
  latestDate,
  mailtoHref,
  smsHref,
  submitBooking,
  totalFor,
} from '../lib/booking';
import { dateKey, longDate, money, monthLabel, sameDay, weekdayInitials } from '../lib/format';
import { scrollToEl } from '../lib/scroll';

const KIT_IDS = STAR_KITS.map((k) => k.id);
const VEHICLE_IDS = HEADLINER.map((v) => v.id);

/**
 * The booking flow.
 *
 * Three steps, because a five-field form asked all at once is where an install
 * request dies on a phone. Everything the visitor configured while scrolling is
 * already selected when they arrive here (see hooks/useBooking), so step one is
 * usually a confirmation rather than a decision.
 *
 * It is deliberately self-contained: with no webhook and no API key it still
 * completes and hands the customer a one-tap SMS or email carrying the exact
 * same summary the webhook would have received. Point VITE_BOOKING_ENDPOINT at
 * an n8n/Zapier URL to capture requests server-side, or flip BOOKING.mode to
 * 'calcom' to swap step two for a real calendar — see README.
 */
export default function Booking() {
  const { t, lang } = useLang();
  const { services, toggle, setServices } = useBooking();
  const reduced = useReducedMotion();

  const [step, setStep] = useState(0);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('');
  const [details, setDetails] = useState({ name: '', phone: '', email: '', vehicle: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [sent, setSent] = useState(null);
  const [delivered, setDelivered] = useState(false);
  // +1 going forward, -1 going back: the next step slides in from the side you
  // are heading toward, so the flow keeps a sense of place.
  const [dir, setDir] = useState(1);

  const stepRef = useRef(null);
  const total = useMemo(() => totalFor(services), [services]);
  // True while anything in the cart is quoted from a starting price — the
  // estimate then has to read "From $x", never "$x".
  const approx = useMemo(() => hasFromPrice(services), [services]);
  const usingCal = BOOKING.mode === 'calcom';

  // Move focus to the top of the new step so a keyboard or screen-reader user
  // is not left behind at the bottom of the previous one.
  useEffect(() => {
    if (step > 0 && stepRef.current) stepRef.current.focus({ preventScroll: true });
  }, [step]);

  const validateStep = () => {
    const next = {};
    if (step === 0 && services.length === 0) next.services = t.booking.pickOne;
    if (step === 1 && !usingCal && (!date || !time)) next.slot = t.booking.pickSlot;
    if (step === 2) {
      if (!details.name.trim()) next.name = t.booking.required;
      if (!isPhone(details.phone)) next.phone = t.booking.invalidPhone;
      if (details.email.trim() && !isEmail(details.email)) next.email = t.booking.invalidEmail;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setDir(1);
    setStep((current) => Math.min(current + 1, 2));
  };

  const goBack = () => {
    setErrors({});
    setDir(-1);
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    setStatus('sending');

    const request = {
      services,
      // A calendar day, not an instant — see lib/format.js#dateKey.
      date: date ? dateKey(date) : null,
      time,
      ...details,
    };

    const result = await submitBooking(request, lang);
    // Whether the request actually reached the shop decides what we are allowed
    // to promise on the next screen. With no webhook configured, nothing was
    // delivered, and telling the customer "we'll text you" would be a lie.
    setDelivered(Boolean(result && result.delivered));
    setSent(request);
    setStatus('done');

    // The confirmation is a fraction of the height of the form it replaces, so
    // the document shrinks under a scroll position that does not move — leaving
    // the customer looking at the footer, with no idea whether anything
    // happened. Put the confirmation back in front of them.
    window.requestAnimationFrame(() => scrollToEl('#book', { block: 'center' }));
  };

  const reset = () => {
    setStatus('idle');
    setSent(null);
    setStep(0);
    setDate(null);
    setTime('');
    setDetails({ name: '', phone: '', email: '', vehicle: '', notes: '' });
    setServices([]);
  };

  if (status === 'done' && sent) {
    return (
      <Section id="book" theme="light">
        <Confirmation request={sent} delivered={delivered} onReset={reset} />
      </Section>
    );
  }

  return (
    <Section id="book" theme="light">
      <SectionHead
        index={t.booking.index}
        label={t.booking.label}
        title={t.booking.title}
        italic={t.booking.titleItalic}
        lead={t.booking.lead}
      />

      <Reveal delay={0.1} className="mt-[clamp(2.5rem,6vh,3.5rem)]">
        <div className="t-line rounded-[var(--radius-panel)] border">
          <Stepper step={step} labels={t.booking.steps} />

          <form onSubmit={handleSubmit} noValidate>
            {/* A dedicated status line, rather than aria-live on the step
                container. Wrapping the whole step meant every advance
                re-announced the entire calendar — 42 day buttons — instead of
                saying where the customer now is. */}
            <p className="sr-only" role="status">
              {`${t.booking.step} ${step + 1} ${t.booking.of} ${t.booking.steps.length}: ${t.booking.steps[step]}`}
            </p>

            <div ref={stepRef} tabIndex={-1} className="p-6 outline-none sm:p-9">
              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={{
                    enter: (d) => (reduced ? {} : { opacity: 0, x: 28 * d }),
                    center: { opacity: 1, x: 0 },
                    exit: (d) => (reduced ? {} : { opacity: 0, x: -28 * d }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                >
                  {step === 0 && (
                    <ServiceStep selected={services} onToggle={toggle} error={errors.services} />
                  )}

                  {step === 1 &&
                    (usingCal ? (
                      <CalEmbed />
                    ) : (
                      <SlotStep
                        date={date}
                        time={time}
                        onDate={(d) => {
                          setDate(d);
                          setTime('');
                        }}
                        onTime={setTime}
                        error={errors.slot}
                      />
                    ))}

                  {step === 2 && (
                    <DetailsStep
                      values={details}
                      errors={errors}
                      onChange={(field, value) =>
                        setDetails((current) => ({ ...current, [field]: value }))
                      }
                      date={date}
                      time={time}
                      services={services}
                      total={total}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ---- Footer bar: running estimate + navigation ---- */}
            <div className="t-line flex flex-col gap-4 border-t p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              {/* The details step already carries the estimate inside its own
                  summary card — showing it twice on one screen reads as a bug. */}
              {step < 2 ? (
                <div className="flex items-baseline gap-3">
                  <span className="label-mono t-fg-faint">{t.booking.estimate}</span>
                  <motion.span
                    key={total}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="tnum type-title t-fg leading-none"
                  >
                    {approx ? `${t.common.from} ` : ''}
                    {money(total, lang)}
                  </motion.span>
                </div>
              ) : (
                <span aria-hidden="true" />
              )}

              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="btn-ghost flex items-center gap-2 rounded-full px-5 py-3 text-[0.875rem]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {t.booking.back}
                  </button>
                )}

                {step < 2 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="btn-invert flex flex-1 items-center justify-center gap-2 rounded-full px-7 py-3 text-[0.875rem] font-medium sm:flex-none"
                  >
                    {t.booking.next}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="btn-invert flex flex-1 items-center justify-center gap-2 rounded-full px-7 py-3 text-[0.875rem] font-medium disabled:opacity-50 sm:flex-none"
                  >
                    {status === 'sending' ? t.booking.submitting : t.booking.submit}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <p className="t-fg-faint mt-5 text-center text-[0.8125rem]">
          {approx ? `${t.booking.fromNote} ` : ''}
          {t.booking.estimateNote}
        </p>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ steps */

function Stepper({ step, labels }) {
  return (
    <ol className="t-line relative flex border-b" role="list">
      {/* Progress hair along the bottom edge: fills to the current step, so the
          stepper also reads as a bar without adding one. */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-px origin-left"
        style={{ backgroundColor: 'rgb(var(--fg) / 0.7)' }}
        initial={false}
        animate={{ scaleX: (step + 1) / labels.length }}
        transition={{ type: 'spring', stiffness: 160, damping: 26 }}
      />
      {labels.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={label} className="relative flex-1">
            <div className="flex items-center gap-2.5 px-4 py-4 sm:px-6">
              <span
                className="label-mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-500"
                style={{
                  borderColor: active || done ? 'transparent' : 'rgb(var(--fg) / 0.22)',
                  backgroundColor: active || done ? 'rgb(var(--fg))' : 'transparent',
                  color: active || done ? 'rgb(var(--bg))' : 'rgb(var(--fg) / 0.4)',
                }}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`hidden text-[0.8125rem] sm:block ${active ? 't-fg' : 't-fg-faint'}`}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <span
                aria-hidden="true"
                className="t-line absolute inset-y-3 right-0 border-r"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ServiceStep({ selected, onToggle, error }) {
  const { t, s } = useLang();

  const groups = [
    { title: t.starlight.label, items: [...STAR_KITS, SHOOTING_STARS, GALAXY_GLASS], exclusive: KIT_IDS },
    { title: t.headliner.label, items: [...HEADLINER, ...PILLARS], exclusive: VEHICLE_IDS },
    { title: t.flow.label, items: [FLOW], exclusive: [] },
  ];

  return (
    <fieldset>
      <legend className="type-title t-fg">{t.booking.chooseService}</legend>
      <p className="t-fg-faint mt-2 text-[0.875rem]">{t.booking.chooseServiceHint}</p>

      <div className="mt-7 flex flex-col gap-8">
        {groups.map((group) => (
          <div key={group.title}>
            <span className="label-mono t-fg-faint">{group.title}</span>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {group.items.map((item) => (
                <ServiceRow
                  key={item.id}
                  item={item}
                  copy={s(item)}
                  checked={selected.includes(item.id)}
                  onToggle={onToggle}
                  // Only the competing items carry the group; add-ons like
                  // shooting stars and pillars stay freely combinable.
                  exclusive={group.exclusive.includes(item.id) ? group.exclusive : []}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <FieldError message={error} className="mt-5" />
    </fieldset>
  );
}

function ServiceRow({ item, copy, checked, onToggle, exclusive = [] }) {
  const { t, lang } = useLang();
  return (
    <label
      // The real control is visually hidden, so the label has to grow the focus
      // ring itself — otherwise a keyboard user tabs through this list with no
      // idea where they are.
      className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-field)] border px-4 py-3.5 transition-all duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
      style={{
        borderColor: checked ? 'rgb(var(--fg) / 0.55)' : 'rgb(var(--fg) / 0.14)',
        backgroundColor: checked ? 'rgb(var(--fg) / 0.05)' : 'transparent',
        outlineColor: 'rgb(var(--fg) / 0.75)',
      }}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={() => onToggle(item.id, exclusive)}
      />
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-300"
        style={{
          borderColor: checked ? 'transparent' : 'rgb(var(--fg) / 0.28)',
          backgroundColor: checked ? 'rgb(var(--fg))' : 'transparent',
        }}
      >
        {checked && (
          <Check className="h-3 w-3" strokeWidth={3} style={{ color: 'rgb(var(--bg))' }} />
        )}
      </span>
      <span className="t-fg min-w-0 flex-1 text-[0.9375rem] leading-snug">{copy.name}</span>
      <span className="tnum t-fg-muted shrink-0 text-[0.875rem]">
        <Price item={item} lang={lang} t={t} />
      </span>
    </label>
  );
}

function SlotStep({ date, time, onDate, onTime, error }) {
  const { t, lang } = useLang();
  const [cursor, setCursor] = useState(() => {
    const start = earliestDate();
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });

  const cells = useMemo(
    () => buildMonth(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );
  const initials = useMemo(() => weekdayInitials(lang), [lang]);

  const min = earliestDate();
  const max = latestDate();
  const canPrev = cursor > new Date(min.getFullYear(), min.getMonth(), 1);
  const canNext = cursor < new Date(max.getFullYear(), max.getMonth(), 1);

  const move = (delta) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  // Hide slots that have already passed when the customer picks today.
  const slots = useMemo(() => {
    if (!date || !sameDay(date, new Date())) return BOOKING.timeSlots;
    const now = new Date();
    return BOOKING.timeSlots.filter((slot) => {
      const [clock, meridiem] = slot.split(' ');
      const [h, m] = clock.split(':').map(Number);
      const hour = (h % 12) + (meridiem === 'PM' ? 12 : 0);
      return hour > now.getHours() || (hour === now.getHours() && m > now.getMinutes());
    });
  }, [date]);

  return (
    <div>
      <h3 className="type-title t-fg">{t.booking.chooseDate}</h3>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12">
        {/* ---- Calendar ---- */}
        <div>
          <div className="flex items-center justify-between">
            <span className="t-fg text-[0.9375rem] font-medium capitalize">
              {monthLabel(cursor, lang)}
            </span>
            <div className="flex gap-1.5">
              <NavButton
                onClick={() => move(-1)}
                disabled={!canPrev}
                label={t.booking.prevMonth}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              </NavButton>
              <NavButton
                onClick={() => move(1)}
                disabled={!canNext}
                label={t.booking.nextMonth}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </NavButton>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1">
            {initials.map((day, i) => (
              <span
                key={`${day}-${i}`}
                className="label-mono t-fg-faint flex h-8 items-center justify-center"
                aria-hidden="true"
              >
                {day}
              </span>
            ))}

            {cells.map((cell) => {
              const active = sameDay(cell.date, date);
              const usable = cell.bookable && cell.inMonth;
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={!usable}
                  onClick={() => onDate(cell.date)}
                  aria-pressed={active}
                  aria-label={longDate(cell.date, lang)}
                  className="tnum flex h-11 items-center justify-center rounded-lg text-[0.875rem] transition-all duration-300 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: active ? 'rgb(var(--fg))' : 'transparent',
                    color: active
                      ? 'rgb(var(--bg))'
                      : usable
                        ? 'rgb(var(--fg) / 0.85)'
                        : 'rgb(var(--fg) / 0.18)',
                    border: active ? '1px solid transparent' : '1px solid rgb(var(--fg) / 0.08)',
                  }}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Times ---- */}
        <div>
          <span className="label-mono t-fg-faint">{t.booking.chooseTime}</span>

          {!date && (
            <p className="t-fg-faint mt-4 text-[0.875rem]">{t.booking.pickDayFirst}</p>
          )}

          {/* Closed days are already unclickable in the grid, so an empty slot
              list can only mean today's remaining times have passed — saying
              "closed" here would contradict the calendar next to it. */}
          {date && slots.length === 0 && (
            <p className="t-fg-faint mt-4 text-[0.875rem]">{t.booking.noSlotsToday}</p>
          )}

          {date && slots.length > 0 && (
            <>
              <p className="t-fg mt-3 text-[0.9375rem] capitalize">
                {longDate(date, lang)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {slots.map((slot) => {
                  const active = slot === time;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onTime(slot)}
                      aria-pressed={active}
                      className="tnum rounded-[var(--radius-field)] border py-3 text-[0.875rem] transition-all duration-300"
                      style={{
                        borderColor: active ? 'transparent' : 'rgb(var(--fg) / 0.14)',
                        backgroundColor: active ? 'rgb(var(--fg))' : 'transparent',
                        color: active ? 'rgb(var(--bg))' : 'rgb(var(--fg) / 0.85)',
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <FieldError message={error} className="mt-5" />
        </div>
      </div>
    </div>
  );
}

function DetailsStep({ values, errors, onChange, date, time, services, total }) {
  const { t, s, lang } = useLang();
  const approx = hasFromPrice(services);

  return (
    <div className="grid gap-9 lg:grid-cols-[1fr_18rem] lg:gap-12">
      <div>
        <h3 className="type-title t-fg">{t.booking.yourDetails}</h3>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            id="name"
            label={t.booking.name}
            value={values.name}
            onChange={onChange}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Field
            id="phone"
            label={t.booking.phone}
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={onChange}
            error={errors.phone}
            autoComplete="tel"
            required
          />
          <Field
            id="email"
            label={t.booking.email}
            type="email"
            inputMode="email"
            value={values.email}
            onChange={onChange}
            error={errors.email}
            autoComplete="email"
          />
          <Field
            id="vehicle"
            label={t.booking.vehicle}
            placeholder={t.booking.vehiclePlaceholder}
            value={values.vehicle}
            onChange={onChange}
          />
          <Field
            id="notes"
            label={t.booking.notes}
            placeholder={t.booking.notesPlaceholder}
            value={values.notes}
            onChange={onChange}
            textarea
            className="sm:col-span-2"
          />
        </div>
      </div>

      {/* ---- Summary ---- */}
      <aside className="t-line t-surface h-fit rounded-[var(--radius-card)] border p-6">
        <span className="label-mono t-fg-faint">{t.booking.summary}</span>

        <ul className="mt-4 flex flex-col gap-2.5">
          {services.map((id) => {
            const item = findService(id);
            if (!item) return null;
            return (
              <li key={id} className="flex items-baseline justify-between gap-3">
                <span className="t-fg-strong text-[0.875rem] leading-snug">{s(item).name}</span>
                <span className="tnum t-fg-muted shrink-0 text-[0.8125rem]">
                  <Price item={item} lang={lang} t={t} />
                </span>
              </li>
            );
          })}
        </ul>

        {date && (
          <p className="t-fg-muted t-line mt-5 border-t pt-4 text-[0.875rem] capitalize">
            {longDate(date, lang)}
            {time && <span className="t-fg-faint"> · {time}</span>}
          </p>
        )}

        <div className="t-line mt-4 flex items-baseline justify-between border-t pt-4">
          <span className="label-mono t-fg-faint">{t.booking.estimate}</span>
          <span className="tnum t-fg text-[1.125rem] font-medium">
            {approx ? `${t.common.from} ` : ''}
            {money(total, lang)}
          </span>
        </div>
      </aside>
    </div>
  );
}

function Confirmation({ request, delivered, onReset }) {
  const { t, lang } = useLang();
  // Two different screens, because they are two different situations. If the
  // request reached the shop we can promise a reply; if it did not, the honest
  // thing is to say so and make the one remaining tap the obvious next move.
  const title = delivered ? t.booking.confirmedTitle : t.booking.almostTitle;
  const body = delivered
    ? t.booking.confirmedBody.replace('{phone}', request.phone)
    : t.booking.almostBody;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal>
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgb(var(--fg))' }}
        >
          <Check className="h-6 w-6" strokeWidth={2} style={{ color: 'rgb(var(--bg))' }} />
        </span>
      </Reveal>

      <Reveal delay={0.08}>
        <h2 className="type-display t-fg mt-7">{title}</h2>
      </Reveal>

      <Reveal delay={0.14}>
        <p className="type-lead t-fg-muted mt-4 text-pretty">{body}</p>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={smsHref(request, lang)}
            className="btn-invert flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[0.9rem] font-medium"
          >
            <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
            {t.booking.sendText}
          </a>
          <a
            href={mailtoHref(request, lang)}
            className="btn-ghost flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[0.9rem] font-medium"
          >
            <Mail className="h-4 w-4" strokeWidth={1.75} />
            {t.booking.sendEmail}
          </a>
        </div>
      </Reveal>

      <Reveal delay={0.26}>
        <p className="t-fg-faint mt-5 text-[0.8125rem]">{t.booking.fallbackNote}</p>
        <p className="t-fg-faint mt-1 text-[0.8125rem]">
          {CONTACT.phone} · {CONTACT.email}
        </p>
      </Reveal>

      <Reveal delay={0.3}>
        <button
          type="button"
          onClick={onReset}
          className="t-fg-muted hover:t-fg mt-9 text-[0.875rem] underline underline-offset-4"
        >
          {t.booking.confirmedAgain}
        </button>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ atoms */

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  textarea = false,
  className = '',
  required = false,
  ...rest
}) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className={className}>
      <label htmlFor={id} className="label-mono t-fg-faint block">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <Tag
        id={id}
        name={id}
        type={textarea ? undefined : type}
        rows={textarea ? 3 : undefined}
        value={value}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(id, e.target.value)}
        className="t-fg mt-2.5 w-full rounded-[var(--radius-field)] border bg-transparent px-4 py-3 text-[0.9375rem] outline-none transition-colors duration-300"
        style={{
          borderColor: error ? 'rgb(220 60 60 / 0.8)' : 'rgb(var(--fg) / 0.16)',
        }}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[0.75rem] text-[#d94040]">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * One price. Items flagged `from` in src/data/services.js are prefixed, so a
 * starting figure is never shown as though it were the final one.
 */
function Price({ item, lang, t }) {
  if (!item.from) return money(item.price, lang);
  return (
    <>
      <span className="label-mono t-fg-faint mr-1">{t.common.from}</span>
      {money(item.price, lang)}
    </>
  );
}

function FieldError({ message, className = '' }) {
  if (!message) return null;
  return (
    <p role="alert" className={`text-[0.8125rem] text-[#d94040] ${className}`}>
      {message}
    </p>
  );
}

function NavButton({ children, onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="t-line t-fg flex h-9 w-9 items-center justify-center rounded-full border transition-opacity duration-300 disabled:opacity-25"
    >
      {children}
    </button>
  );
}
