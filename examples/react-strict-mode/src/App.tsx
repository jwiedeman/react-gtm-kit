import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { useGtmConsent, useGtmPush } from '@react-gtm-kit/react-modern';

const consentDefaults = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_personalization: 'denied',
  ad_user_data: 'denied'
} as const;

const styles: Record<string, string> = {
  container: 'min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-6 font-sans p-6',
  panel: 'max-w-xl w-full rounded-xl bg-slate-900 shadow-xl p-6 space-y-4 border border-slate-800',
  heading: 'text-2xl font-semibold',
  code: 'font-mono text-amber-300',
  button:
    'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
  primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
  pill: 'inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300',
  nav: 'flex items-center justify-center gap-3 text-sm font-medium',
  navLink:
    'rounded-lg px-3 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 text-slate-300 hover:text-amber-300',
  navActive:
    'rounded-lg px-3 py-1 bg-amber-400 text-slate-950 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
};

const useRouteAwarePageView = (): void => {
  const push = useGtmPush();
  const location = useLocation();
  const lastPathRef = useRef<string>();

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;

    if (lastPathRef.current === path) {
      return;
    }

    lastPathRef.current = path;

    const frame = requestAnimationFrame(() => {
      push({
        event: 'page_view',
        page_path: path,
        page_title: document.title || 'React StrictMode example'
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [location, push]);
};

const ConsentControls = () => {
  const { setConsentDefaults, updateConsent } = useGtmConsent();
  const [consent, setConsent] = useState<'denied' | 'granted'>('denied');

  useEffect(() => {
    setConsentDefaults(consentDefaults);
  }, [setConsentDefaults]);

  const handleGrant = useCallback(() => {
    setConsent('granted');
    updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_personalization: 'granted',
      ad_user_data: 'granted'
    });
  }, [updateConsent]);

  const handleRevoke = useCallback(() => {
    setConsent('denied');
    updateConsent(consentDefaults);
  }, [updateConsent]);

  return (
    <div className={styles.panel}>
      <div className={styles.pill}>Consent controls</div>
      <p className="text-sm text-slate-300">
        Toggle consent to see how the adapter forwards updates to the GTM client. In a real app the consent state would
        flow from your CMP or settings page.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGrant}
          className={`${styles.button} ${styles.primary}`}
          disabled={consent === 'granted'}
        >
          Grant consent
        </button>
        <button
          type="button"
          onClick={handleRevoke}
          className={`${styles.button} ${styles.secondary}`}
          disabled={consent === 'denied'}
        >
          Revoke consent
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Current consent state: <span className={styles.code}>{consent}</span>
      </p>
    </div>
  );
};

const CustomEventDemo = () => {
  const push = useGtmPush();
  const [count, setCount] = useState(0);

  const sendEvent = useCallback(() => {
    const nextCount = count + 1;
    setCount(nextCount);
    push({
      event: 'cta_click',
      cta_label: 'Get started',
      click_count: nextCount
    });
  }, [count, push]);

  return (
    <div className={styles.panel}>
      <div className={styles.pill}>Custom events</div>
      <p className="text-sm text-slate-300">
        Click the button to emit structured events into the data layer. Inspect{' '}
        <span className={styles.code}>window.dataLayer</span>
        to see pushes happen.
      </p>
      <button type="button" onClick={sendEvent} className={`${styles.button} ${styles.primary}`}>
        Emit CTA event
      </button>
      <p className="text-xs text-slate-400">Events sent: {count}</p>
    </div>
  );
};

const Overview = () => {
  useEffect(() => {
    document.title = 'React StrictMode example';
  }, []);

  return (
    <>
      <CustomEventDemo />
      <ConsentControls />
    </>
  );
};

const Pricing = () => {
  const push = useGtmPush();

  useEffect(() => {
    document.title = 'Pricing | React StrictMode example';
  }, []);

  const trackConversion = useCallback(() => {
    push({
      event: 'begin_checkout',
      page_section: 'pricing',
      cta_label: 'Start free trial'
    });
  }, [push]);

  return (
    <div className={styles.panel}>
      <div className={styles.pill}>Pricing</div>
      <p className="text-sm text-slate-300">
        Route transitions push page views automatically. Use this secondary CTA to prove custom events still work after
        navigating.
      </p>
      <button type="button" className={`${styles.button} ${styles.primary}`} onClick={trackConversion}>
        Start free trial
      </button>
      <p className="text-xs text-slate-400">
        Inspect <span className={styles.code}>window.dataLayer</span> to watch navigation and conversion events stream
        in.
      </p>
    </div>
  );
};

const PageViewTracker = (): JSX.Element => {
  useRouteAwarePageView();
  return <></>;
};

const App = (): JSX.Element => {
  const location = useLocation();

  const containerList = useMemo(() => {
    const raw = import.meta.env.VITE_GTM_CONTAINERS ?? 'GTM-XXXX';
    return raw
      .split(',')
      .map((id: string) => id.trim())
      .filter((id: string) => Boolean(id))
      .join(', ');
  }, []);

  return (
    <main className={styles.container}>
      <PageViewTracker />
      <section className="space-y-4 text-center">
        <div className={styles.pill}>React StrictMode</div>
        <h1 className={styles.heading}>GTM Provider demo</h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          This sandbox mounts the GTM provider inside <span className={styles.code}>{'<React.StrictMode>'}</span>. The
          router integration pushes a <span className={styles.code}>page_view</span> event on every navigation without
          duplicating scripts or data layer entries.
        </p>
        <p className="text-xs text-slate-500">Configured containers: {containerList}</p>
        <nav className={styles.nav} aria-label="Example pages">
          <Link to="/" className={location.pathname === '/' ? styles.navActive : styles.navLink}>
            Overview
          </Link>
          <Link to="/pricing" className={location.pathname === '/pricing' ? styles.navActive : styles.navLink}>
            Pricing
          </Link>
        </nav>
      </section>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </main>
  );
};

export default App;
