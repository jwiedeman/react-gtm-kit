import type { ConsentState } from '@react-gtm-kit/core';

import { DEFAULT_CONSENT } from './gtm';

export const CONSENT_COOKIE_NAME = 'next-app-consent';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseConsentCookie = (value: string | undefined | null): ConsentState | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    const entries = Object.entries(DEFAULT_CONSENT);
    for (const [key] of entries) {
      const consentValue = parsed[key];
      if (consentValue !== 'granted' && consentValue !== 'denied') {
        return null;
      }
    }

    return parsed as ConsentState;
  } catch {
    return null;
  }
};

export const serializeConsentCookie = (value: ConsentState): string => JSON.stringify(value);

export const getInitialConsent = (cookieHeader: string | null | undefined): ConsentState => {
  if (!cookieHeader) {
    return DEFAULT_CONSENT;
  }

  const cookies = cookieHeader.split(';').map((chunk) => chunk.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!match) {
    return DEFAULT_CONSENT;
  }

  const [, rawValue] = match.split('=');
  const parsed = parseConsentCookie(decodeURIComponent(rawValue ?? ''));
  return parsed ?? DEFAULT_CONSENT;
};

export const persistConsentCookie = (value: ConsentState): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const serialized = serializeConsentCookie(value);
  const encoded = encodeURIComponent(serialized);
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${CONSENT_COOKIE_NAME}=${encoded}; Path=/; SameSite=Lax; Expires=${expires}`;
};
