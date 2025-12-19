'use client';

import { useEffect, useMemo } from 'react';
import { useTrackPageViews } from '@jwiedeman/gtm-kit-next';
import { pushEvent } from '@jwiedeman/gtm-kit';
import { useGtmClient, useGtmConsent } from '@jwiedeman/gtm-kit-react';

import { DEFAULT_CONSENT } from '../lib/gtm';
import { getInitialConsent } from '../lib/consent-cookie';

const buildPageViewPayload = ({ pagePath, url, title }: { pagePath: string; url: string; title?: string }) => ({
  page_path: pagePath,
  page_location: url,
  ...(title ? { page_title: title } : {})
});

const readConsentFromDocument = () => {
  if (typeof document === 'undefined') {
    return DEFAULT_CONSENT;
  }

  return getInitialConsent(document.cookie ?? null);
};

export const GtmBridge = () => {
  const client = useGtmClient();
  const { setConsentDefaults } = useGtmConsent();

  const initialConsent = useMemo(() => readConsentFromDocument(), []);

  useEffect(() => {
    setConsentDefaults(initialConsent);
  }, [initialConsent, setConsentDefaults]);

  useTrackPageViews({
    client,
    buildPayload: buildPageViewPayload,
    pushEventFn: pushEvent,
    includeSearchParams: true,
    trackHash: true
  });

  return null;
};
