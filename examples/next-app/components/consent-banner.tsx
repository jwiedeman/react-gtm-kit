'use client';

import { useState } from 'react';
import { useGtmConsent } from '@react-gtm-kit/react-modern';

import { DEFAULT_CONSENT, GRANTED_CONSENT } from '../lib/gtm';

export const ConsentBanner = () => {
  const { updateConsent } = useGtmConsent();
  const [visible, setVisible] = useState(true);
  const [hasGranted, setHasGranted] = useState(false);

  if (!visible) {
    return (
      <button
        type="button"
        className="consent-toggle"
        onClick={() => setVisible(true)}
        aria-label="Review consent preferences"
      >
        Manage consent
      </button>
    );
  }

  const handleAccept = () => {
    updateConsent(GRANTED_CONSENT);
    setHasGranted(true);
    setVisible(false);
  };

  const handleReject = () => {
    updateConsent(DEFAULT_CONSENT);
    setHasGranted(false);
    setVisible(false);
  };

  return (
    <aside className="consent-banner" role="dialog" aria-labelledby="consent-banner-title">
      <div>
        <h2 id="consent-banner-title">Consent preferences</h2>
        <p>
          This example starts with Consent Mode set to denied. Use the controls below to flip consent states and watch
          how events continue to queue without losing data integrity.
        </p>
      </div>
      <div className="consent-actions">
        <button type="button" className="primary" onClick={handleAccept}>
          Accept analytics
        </button>
        <button type="button" onClick={handleReject}>
          Keep essential only
        </button>
      </div>
      {hasGranted ? <p className="consent-status">Analytics consent granted.</p> : null}
    </aside>
  );
};
