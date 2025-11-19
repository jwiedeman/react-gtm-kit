# Risk Log

This log tracks open privacy, security, and compliance risks along with mitigation status. Update entries when new information emerges or when actions close the gap.

| ID    | Category   | Description                                                                                    | Impact | Likelihood | Mitigation / Next Steps                                                                                                       | Owner           | Status  |
| ----- | ---------- | ---------------------------------------------------------------------------------------------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------- | ------- |
| R-001 | Privacy    | Consent prompt deployment may slip for regional launches, delaying GTM enablement in EEA.      | High   | Medium     | Integrate CMP SDK by M1; add QA checklist covering consent states. Track implementation in product roadmap.                   | Privacy Eng     | Open    |
| R-002 | Security   | Automated dependency updates not yet enabled, increasing time-to-remediate for new advisories. | Medium | Medium     | Configure Dependabot (or Renovate) for workspace packages; triage weekly. Reference TK-013 follow-up task.                    | Platform Eng    | Open    |
| R-003 | Compliance | Server-side tagging reference lacks documented DPIA considerations.                            | Medium | Low        | Document data flow and responsibilities in forthcoming `docs/how-to/server-integration.md`; review with legal before release. | Privacy Counsel | Planned |
| R-004 | Operations | No formal security disclosure channel published for external reporters.                        | Low    | Low        | Draft `SECURITY.md` with contact email and triage expectations before beta launch.                                            | OSS Maintainer  | Planned |

| R-005 | Privacy | Consent evidence retention is inconsistent across apps, risking audit gaps. | Medium | Low | Add release sign-off checklist to ensure consent records (timestamp, version, region) are stored alongside deploys; automate archival in observability backlog. | Privacy Eng | Open |
| R-006 | Compliance | DPIA refresh for GTM containers not yet scheduled for the next milestone. | Medium | Medium | Book privacy counsel review during M0, include noscript + consent changes, and record decision links in `docs/design/DECISIONS.md`. | Privacy Counsel | Open |
Use consistent IDs when updating rows so stakeholders can reference them in meetings and release checklists.
