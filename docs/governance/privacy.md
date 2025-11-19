# Privacy Requirements and Guidance

## Purpose

This document summarizes the privacy expectations, regional obligations, and governance controls for adopting React GTM Kit in production. It complements implementation notes in the README and usage guides by clarifying what responsibilities fall on the integrator versus the library.

## Consent Mode v2 responsibilities

- **Integrator-owned UI** – Teams must provide an accessible consent prompt that gathers explicit preferences before initializing GTM in regions that require prior consent (e.g., EEA, UK, Brazil).
- **Signal mapping** – Use the `setConsentDefaults` and `updateConsent` APIs to mirror the consent categories exposed to end-users. Map UI responses to Google’s parameters (`ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`).
- **Region awareness** – Detect the visitor’s regulatory context (Geo IP, user selection, or CMP) and supply `ConsentRegionOptions` to scope defaults or updates. The library forwards `region` and `wait_for_update` to GTM but does not derive them automatically.
- **Audit trail** – Persist proof of consent (timestamp, categories, version of the notice) in application storage to satisfy GDPR and CCPA record-keeping.

## Jurisdiction-specific obligations

- **GDPR/UK GDPR**
  - Default to deny/hold tracking until the visitor opts in. Honor withdrawal immediately and flush queued GTM pushes that depend on denied signals.
  - Present purpose-specific toggles that align with the four Consent Mode parameters and avoid bundling unrelated processing into a single switch.
  - Expose a data export route for GTM-related identifiers (e.g., client IDs) and confirm erasure on request within the statutory window.
  - Document processors (Google, downstream destinations) in the ROPA and ensure a DPA is executed with each vendor enabled through GTM.
- **CCPA/CPRA**
  - Respect “Do Not Sell/Share” (DNS) signals by mapping the user choice to `ad_user_data` and `ad_personalization` = denied before any ad tech tags run.
  - Provide a self-service opt-out link in the site footer/header and wire it to the consent update API plus downstream suppression lists.
  - Maintain a dedicated inbox/workflow for access/deletion requests and log response timestamps for the annual audit.
- **Brazil LGPD and other regions**
  - Mirror the GDPR defaults for prior consent, and publish locale-specific privacy notices. Track any country overrides in the consent presets you pass to `setConsentDefaults`.
  - Keep a register of local bases for processing (consent vs. legitimate interest) for each GTM tag configuration.

## Data minimization and tagging hygiene

- Push only the attributes required for measurement. Avoid sending PII/PHI through the data layer. Configure GTM variables to anonymize or hash identifiers when possible.
- Keep a catalog of events, parameters, and owning teams in `docs/design/tracking-matrix.md` so stakeholders can review which data is collected and why.
- Validate that ecommerce payloads comply with local tax disclosure rules before sending them to GTM.

## Noscript fallback considerations

- Noscript requests load the GTM container via an iframe. Ensure your privacy notice explains that limited tracking may continue for users without JavaScript.
- If you disable noscript for specific locales, document the rationale and communicate reduced measurement accuracy to analytics stakeholders.

## Data retention and deletion workflows

- Respect user requests to erase tracking identifiers by purging cookies or local storage that GTM tags may set. Provide a self-service UI when feasible.
- Coordinate with downstream destinations configured inside GTM (GA4, Ads, Floodlight) to ensure retention windows align with corporate policy.

## Third-party risk management

- Track all external tags deployed through GTM in your vendor inventory. Ensure each vendor has a signed data processing agreement before enabling their tag in production.
- Periodically review GTM workspaces for rogue or deprecated tags that may violate policy.

## Governance and reviews

- Privacy counsel should review any new tracking scenario before it moves to production.
- Re-run the consent end-to-end tests quarterly and whenever regulations change.
- Capture approvals and outstanding issues in the project risk log (`docs/governance/risk-log.md`).
- Maintain a **sign-off checklist** per release: privacy notice copy reviewed, consent presets validated for covered regions, DNS/DSR routing confirmed, and DPIA re-run when new identifiers are introduced.
- Store evidence of sign-off (counsel email or ticket link) alongside the release tag to support audits.
