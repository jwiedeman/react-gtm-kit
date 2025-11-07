# Support runbook and escalation matrix

This runbook outlines how maintainers triage and resolve issues reported by the community,
customers, and internal stakeholders. Use it alongside the [operability plan](./operability.md)
so telemetry and support workflows stay aligned.

## Roles & responsibilities

| Role                | Primary duties                                                                                         | Coverage                          |
| ------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Incident Commander  | Coordinates response during critical/high incidents, ensures communication cadence, drives resolution. | Core maintainer rotation (weekly) |
| Support Lead        | Owns backlog triage, routes community questions, updates FAQs/documentation.                           | Docs maintainer                   |
| Examples Maintainer | Validates reproduction steps in example apps, keeps smoke tests green.                                 | Examples maintainer               |
| Communications Lead | Posts public updates in GitHub Discussions, Discord, and status page.                                  | Rotates monthly                   |

Document on-call assignments in the internal calendar. Update pager rotations whenever maintainers
change availability.

## Intake channels

- **GitHub Issues** – primary mechanism for bug reports and feature requests. Templates enforce
  reproduction steps and environment details.
- **GitHub Discussions** – Q&A, roadmap feedback, and incident updates. Pin active incidents for
  visibility.
- **Discord (`#react-gtm-kit`)** – Real-time community support. Moderated by Support Lead; move
  actionable items into GitHub issues.
- **Email (`support@react-gtm-kit.dev`)** – Reserved for enterprise adopters or privacy-sensitive
  disclosures.

Monitor all channels during business hours and set up notifications for off-hours escalation triggers.

## Severity definitions

| Severity | Description                                                                                  | Initial response target | Resolution target   |
| -------- | -------------------------------------------------------------------------------------------- | ----------------------- | ------------------- |
| Sev 1    | Widespread outages, critical regressions, or security issues with known exploitation vector. | 15 minutes              | 4 hours             |
| Sev 2    | High-impact bugs (consent broken, double script injection) without full outage.              | 1 hour                  | 1 business day      |
| Sev 3    | Functional bugs with workarounds, degraded examples, doc gaps causing confusion.             | 4 business hours        | 3 business days     |
| Sev 4    | Minor defects, feature requests, non-blocking questions.                                     | 1 business day          | Prioritized backlog |

Escalate any report that implicates user privacy or security to Sev 1 until assessed.

## Triage workflow

1. **Acknowledge** – Respond via the originating channel within the target response window, assign a
   severity, and label the GitHub issue (e.g., `severity:1`).
2. **Assess** – Reproduce using provided steps. Engage Examples Maintainer if reproduction requires
   sample apps.
3. **Assign** – Identify an owner. High-severity incidents require an incident channel (`#incident-gtm`)
   and meeting notes stored in `docs/governance/incidents/YYYY-MM-DD.md`.
4. **Communicate** – Post status updates every 30 minutes for Sev 1, hourly for Sev 2, and daily for
   Sev 3 until resolution. Summaries should include mitigation steps and ETA.
5. **Resolve** – Once a fix ships or a mitigation is live, update the originating report, close the
   incident channel, and archive notes in the repository.
6. **Review** – Conduct a post-incident review within 3 business days. Capture learnings in the risk
   log and update documentation as needed.

## Escalation paths

- **Primary on-call** → **Secondary on-call** (within 15 minutes if no acknowledgement).
- If both miss the page, escalate to **Engineering Manager** via PagerDuty override.
- Security/privacy incidents notify the **Security Liaison** immediately and trigger the private
  disclosure workflow defined in `docs/governance/security-review.md`.
- Marketing/PR-sensitive incidents notify the Communications Lead and coordinate with marketing.

## Community support routines

- Host a monthly community call in Discord to discuss roadmap updates and answer questions.
- Summarize call notes in GitHub Discussions for asynchronous readers.
- Maintain a curated FAQ in `docs/how-to/troubleshooting.md`; update after every Sev 2+ incident.
- Track recurring questions in a shared spreadsheet to inform documentation improvements.

## Tooling checklist

- PagerDuty schedules for primary/secondary on-call remain up to date.
- GitHub issue templates auto-label severity and request reproduction links.
- Discord bot auto-responds with support hours and directs users to open issues for tracked work.
- Email auto-responder acknowledges receipt and links to status page.

## Status page cadence

- Publish status updates on incidents lasting longer than 30 minutes.
- Postmortems link back to corresponding GitHub issues and documentation updates.
- Review status page copy quarterly to ensure contacts and SLAs remain accurate.

Keep this runbook version-controlled. Update it whenever roles, tooling, or service-level objectives
change so the team can rely on it during high-pressure incidents.
