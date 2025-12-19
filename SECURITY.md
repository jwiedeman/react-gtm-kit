# Security Policy

## Reporting a vulnerability

- **Email:** security@gtm-kit.dev (monitored Monday–Friday, 9:00–17:00 PT).
- **Use private channels:** Please do not open public GitHub issues or discussions for suspected security problems.
- **Include details:** Share the affected package(s) and version(s), reproduction steps, expected vs. actual behavior, and any logs or proof-of-concept snippets. If possible, describe potential impact and suggested mitigations.

## What happens next

- **Acknowledgement:** We respond to new reports within **1 business day**.
- **Triage:** An initial severity assessment is provided within **3 business days**, aligned to the support runbook (Sev 1 = critical/actively exploitable).
- **Remediation targets:**
  - Critical / Sev 1: patch or hotfix within **7 days** of acknowledgement, plus advisory.
  - High: patch within **14 days**.
  - Medium/Low: addressed in the next scheduled release or maintenance window.
- **Coordinated disclosure:** We will work with you on timelines for public disclosure and credit once a fix or mitigation is available.

## Scope and supported versions

- Active support covers the main branch and the most recent minor release for each `@jwiedeman/gtm-kit*` package.
- Security fixes may be backported to the previous minor release when the issue is severe and upgrade blockers exist; otherwise, consumers should upgrade to the latest version.

## Non-security questions

For feature requests, bug reports, or integration help, please open a standard GitHub issue instead of emailing the security contact.
