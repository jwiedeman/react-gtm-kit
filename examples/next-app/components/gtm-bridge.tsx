'use client';

import { useEffect } from 'react';
import { useTrackPageViews } from '@react-gtm-kit/next';
import { pushEvent } from '@react-gtm-kit/core';
import { useGtmClient, useGtmConsent } from '@react-gtm-kit/react-modern';

import { DEFAULT_CONSENT } from '../lib/gtm';

const buildPageViewPayload = ({ pagePath, url, title }: { pagePath: string; url: string; title?: string }) => ({
  page_path: pagePath,
  page_location: url,
  ...(title ? { page_title: title } : {})
});

export const GtmBridge = () => {
  const client = useGtmClient();
  const { setConsentDefaults } = useGtmConsent();

  useEffect(() => {
    setConsentDefaults(DEFAULT_CONSENT);
  }, [setConsentDefaults]);

  useTrackPageViews({
    client,
    buildPayload: buildPageViewPayload,
    pushEventFn: pushEvent,
    includeSearchParams: true,
    trackHash: true
  });

  return null;
};
