# DPIA and consent evidence workflow

Documenting the data flow behind your GTM deployment and retaining consent evidence
keeps privacy counsel, auditors, and regulators aligned. Use this guide to pair the
React GTM Kit server integration with data protection impact assessment (DPIA)
artifacts and durable consent records.

## Capture the DPIA summary

- **Scope** – Describe the surfaces touched by GTM: web container, server container,
  relay service, and any CMP callbacks.
- **Data flow** – Diagram how identifiers (client ID, session ID), consent values,
  and event payloads move from the browser to the relay and onward to the server
  container. Reference the steps in `docs/how-to/server-integration.md`.
- **Roles and responsibilities** – Note which teams own the CMP configuration,
  GTM workspace, relay hosting, and consent evidence storage.
- **Risk review** – Link to mitigations tracked in `docs/governance/risk-log.md`
  and outcomes logged in `docs/design/DECISIONS.md`.

Record the summary in your product wiki or attach it to the release PR so counsel
can comment before launch.

## Store consent evidence per release

Auditable consent records should survive redeployments:

- Export the consent banner configuration (version, locale, and CMP build hash).
- Persist anonymized data layer snapshots that include consent defaults and the
  first user update. Retain at least the timestamp, region, and consent state.
- Archive CMP event logs for a short window after each deploy to prove ordering and
  propagation through the GTM client.
- Keep evidence next to your release artifacts (cloud bucket or repository folder)
  with access restricted to privacy engineering and audit teams.

## Schedule DPIA refreshes

- Re-run the DPIA when GTM scopes change (new destinations, new identifiers, or
  server relay expansions) or at least once per milestone.
- Add the refresh date and owner to `docs/governance/maintenance.md` so the cadence
  surfaces with other operational checks.
- Mirror the refresh schedule in `docs/design/DECISIONS.md` when consent behavior or
  data flows change.

## Checklist before launch

- [ ] DPIA summary for the current release reviewed by privacy counsel.
- [ ] Consent evidence archived alongside deploy artifacts with timestamps and
      regions.
- [ ] Risk log updated with the latest mitigation notes and owners.
- [ ] Next DPIA refresh date recorded in maintenance docs.
