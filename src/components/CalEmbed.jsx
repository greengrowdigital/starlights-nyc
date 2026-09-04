import { useEffect, useRef, useState } from 'react';
import { BOOKING } from '../config';
import { useLang } from '../i18n/LanguageContext';

/**
 * Optional Cal.com step.
 *
 * Only mounted when `BOOKING.mode === 'calcom'` in src/config.js, and the embed
 * script is fetched at that point rather than bundled — so a site running the
 * built-in calendar never pays for a dependency it does not use, and switching
 * to Cal.com later needs no npm install and no API key, just a booking link.
 */
export default function CalEmbed() {
  const { t } = useLang();
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    // Cal's own loader stub: queues calls until embed.js resolves.
    if (!window.Cal) {
      const script = document.createElement('script');
      script.src = 'https://app.cal.com/embed/embed.js';
      script.async = true;
      const queue = [];
      const cal = function (...args) {
        queue.push(args);
      };
      cal.q = queue;
      cal.loaded = false;
      window.Cal = cal;
      script.onload = () => setReady(true);
      document.head.appendChild(script);
    } else {
      setReady(true);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!ready || !window.Cal || !hostRef.current) return;
    window.Cal('init', { origin: 'https://cal.com' });
    window.Cal('inline', {
      elementOrSelector: hostRef.current,
      calLink: BOOKING.calcom.link,
      layout: 'month_view',
    });
    window.Cal('ui', {
      theme: BOOKING.calcom.theme,
      hideEventTypeDetails: false,
      layout: 'month_view',
    });
  }, [ready]);

  return (
    <div>
      <div
        ref={hostRef}
        className="min-h-[34rem] w-full overflow-hidden rounded-[var(--radius-card)]"
      />
      {!ready && <p className="t-fg-faint mt-4 text-[0.875rem]">{t.booking.calFallback}</p>}
    </div>
  );
}
