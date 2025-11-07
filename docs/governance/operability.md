# Operability and observability plan

This guide captures the post-launch operational posture for React GTM Kit. It focuses on
collecting actionable telemetry, validating runtime health, and closing the feedback loop with
support so issues surface quickly and are resolved with minimal disruption.

## Objectives

- **Detect errors fast** – capture exceptions, rejected promises, and integration misconfiguration
  warnings from example apps and adapters.
- **Track usage health** – observe key metrics around container initialization, consent updates,
  and data layer pushes to ensure regressions are visible.
- **Maintain release confidence** – verify bundle size, coverage, and runtime telemetry before
  promoting releases.
- **Close the loop with support** – feed observability signals into incident and customer support
  workflows so users receive timely updates.

## Telemetry sources

| Surface                         | Signals collected                                                                             | Tooling                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Core package (unit/integration) | Logger warnings, init errors, queue flush anomalies (captured through existing test harness). | Jest reporters + CI artifacts                         |
| Examples & E2E runners          | Browser console errors, network failures, consent mismatch logs, GTM script load timings.     | Playwright traces, Next.js example logging            |
| Documentation site              | Broken link checks, build errors, search query telemetry (aggregated, anonymous).             | VitePress build output + privacy-preserving analytics |
| Production error reporting      | Unhandled exceptions in shipped packages surfaced via user reproduction snippets.             | Sentry SDK embedded in examples + server reference    |
| Performance & usage metrics     | Container init duration, number of queued pushes before flush, consent update latency.        | Datadog RUM (examples) or OpenTelemetry exporters     |

> **Privacy note:** Observability in examples collects aggregate timings only and is disabled by
> default. Enable the tooling when running demos or smoke tests to avoid unintentionally shipping
> telemetry in consumer apps.

## Error reporting workflow

1. **Capture** – Examples and server reference apps initialize the Sentry SDK using the shared
   DSN stored in `examples/.env.example`. Core packages expose hooks that allow consumers to forward
   structured error events without bundling any vendor SDK.
2. **Enrich** – Attach GTM container IDs, consent state, and current route to error context. Avoid
   including end-user PII; rely on hashed identifiers where needed.
3. **Route** – Configure Sentry alert rules that open GitHub issues via the maintainer webhook for
   `high` severity events (see support runbook). Lower severity warnings go to the maintainers'
   Slack channel for triage during office hours.
4. **Resolve** – Link fixes to the originating Sentry issue. Validate through CI and targeted smoke
   tests before marking the incident resolved.

## Metrics and dashboards

- **Initialization success rate** – percent of example app sessions where all configured GTM
  containers finish loading within 5 seconds. Alert at 97%, page maintainers at 95%.
- **Consent update propagation** – monitor time between CMP event and consent API call. Investigate
  when median exceeds 1 second; alert if the 95th percentile exceeds 2.5 seconds.
- **Data layer queue depth** – track queued events at init time. Unexpected spikes ( >10 queued
  pushes) indicate delayed script loads or integration bugs.
- **Bundle size budgets** – wire `size-limit` reports into Datadog via CI webhook so release
  regressions trigger alerts automatically.

Each metric should feed into a Datadog dashboard shared with core, docs, and examples owners. Use
saved views for each milestone (M1–M7) to verify readiness before promotion.

## Alerting matrix

| Severity | Example signals                                                 | Action                                                                          |
| -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Critical | GTM containers fail to load across examples, telemetry offline. | Page on-call maintainer immediately, post status update in GitHub Discussions.  |
| High     | Consent updates delayed, repeated script dedupe failures.       | Assign incident commander, open tracking issue, coordinate fix within 24 hours. |
| Medium   | Sporadic warnings, documentation build failures.                | Triage during office hours, schedule fix before next release cut.               |
| Low      | Intermittent debug logs, user questions without impact.         | Capture in support backlog, address in docs or FAQs.                            |

Alert routing uses PagerDuty for critical/high incidents with backup email notifications for
redundancy. Medium and low severities rely on Slack channel `#gtm-kit-maintainers` with daily triage.

## Operational checklists

### Daily health checks

- Review Sentry alert digest for new high-severity errors.
- Inspect Datadog dashboard for metric thresholds trending upward.
- Confirm latest CI runs for `main` and open PRs are green.
- Respond to open GitHub Discussions or Discord questions within 24 hours.

### Pre-release validation

- Run `pnpm run verify:ci` to execute linting, tests, size checks, and example smoke tests.
- Review telemetry dashboards to confirm no active incidents or unresolved alerts.
- Ensure documentation updates referencing new features include observability guidance.
- Confirm support runbook owners are aware of release timing and on-call coverage.

## Continuous improvement

- Record every incident in the risk log with root cause and remediation notes.
- Retrospect monthly on alert noise—tune thresholds or disable redundant signals.
- Audit Sentry and Datadog access quarterly to enforce least privilege.
- Keep example apps' telemetry dependencies updated to the latest minor versions.

Maintainers should update this plan whenever new tooling is introduced or when incident reviews
suggest better alerting or escalation paths.
