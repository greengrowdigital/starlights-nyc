import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { scrollToEl } from '../lib/scroll';

/**
 * The cart is shared, not local to the booking section.
 *
 * Every product act ends in a CTA, and each of those CTAs pre-loads exactly
 * what the visitor was looking at before scrolling them to the form. That is
 * the difference between "a landing page with a contact form at the bottom"
 * and a page where the scroll itself is the configurator.
 */
const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [services, setServices] = useState([]);

  /**
   * Toggle one service.
   *
   * `exclusiveGroup` is the set this item competes with — the three ceiling
   * kits, or the three headliner sizes. Ticking one clears the others, because
   * a car has exactly one ceiling and exactly one headliner: an order for a
   * 550-star kit AND an 1,100-star kit is not a bigger sale, it is a bad quote
   * the shop has to phone the customer to untangle.
   */
  const toggle = useCallback((id, exclusiveGroup = []) => {
    setServices((current) => {
      if (current.includes(id)) return current.filter((s) => s !== id);
      const cleared = exclusiveGroup.length
        ? current.filter((s) => !exclusiveGroup.includes(s))
        : current;
      return [...cleared, id];
    });
  }, []);

  const has = useCallback((id) => services.includes(id), [services]);

  const clear = useCallback(() => setServices([]), []);

  /**
   * Load a selection and jump to the form. `replaceGroup` drops any previously
   * chosen item from the same group first, so picking the 800-star kit after
   * the 550 swaps it rather than billing for both ceilings.
   */
  const requestBooking = useCallback((ids, replaceGroup = []) => {
    const wanted = Array.isArray(ids) ? ids : [ids];
    setServices((current) => {
      const kept = current.filter((id) => !replaceGroup.includes(id));
      return Array.from(new Set([...kept, ...wanted]));
    });

    scrollToEl('#book');
  }, []);

  const value = useMemo(
    () => ({ services, setServices, toggle, has, clear, requestBooking }),
    [services, toggle, has, clear, requestBooking],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>');
  return ctx;
}
