import { useCallback, useEffect, useMemo, useState } from 'react';
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
  pill: 'inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300'
};

const useStrictModeSafePageView = (): void => {
  const push = useGtmPush();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      push({
        event: 'page_view',
        page_path: window.location.pathname,
        page_title: document.title || 'React StrictMode example'
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [push]);
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

const App = (): JSX.Element => {
  useStrictModeSafePageView();

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
      <section className="space-y-2 text-center">
        <div className={styles.pill}>React StrictMode</div>
        <h1 className={styles.heading}>GTM Provider demo</h1>
        <p className="text-sm text-slate-300 max-w-xl">
          This sandbox mounts the GTM provider inside <span className={styles.code}>{'<React.StrictMode>'}</span>.
          Development builds remount components to surface side effects; the adapter keeps the GTM client stable so your
          data pushes stay idempotent.
        </p>
        <p className="text-xs text-slate-500">Configured containers: {containerList}</p>
      </section>
      <CustomEventDemo />
      <ConsentControls />
    </main>
  );
};

export default App;
