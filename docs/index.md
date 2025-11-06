# React GTM Kit Documentation

Welcome to the official documentation site for React GTM Kit. This site bundles the charter,
architecture decisions, implementation guides, and governance playbooks that appear throughout
the repository into a browsable experience.

## Quickstart

1. Install the packages you need:
   ```bash
   pnpm add @react-gtm-kit/core
   ```
2. Initialize the GTM client once at application startup:

   ```ts
   import { initGtm, pushEvent } from '@react-gtm-kit/core';

   initGtm({
     containerIds: ['GTM-XXXXXXX']
   });
   ```

3. Push events or consent updates wherever they happen:
   ```ts
   pushEvent({
     event: 'page_view',
     page_path: window.location.pathname
   });
   ```
4. Visit the Concepts section to understand the architecture and consent lifecycle, then explore
   the How-to guides for setup, migration, debugging, and analytics integration recipes.

## Project charter

Review the [project charter](https://github.com/react-gtm-kit/react-gtm-kit/blob/main/README.md#1-project-charter)
for the guiding principles that drive implementation decisions across the kit.

## Scope & non-goals

We stay tightly scoped to the browser GTM contract. Read the
[scope definition](https://github.com/react-gtm-kit/react-gtm-kit/blob/main/README.md#2-scope--non-goals)
to understand what we commit to shipping and what is intentionally left out.

## Functional requirements

Every package is built to satisfy the
[functional requirements](https://github.com/react-gtm-kit/react-gtm-kit/blob/main/README.md#4-functional-requirements)
defined in the main README. Acceptance criteria, tests, and documentation align to these requirements.

## Milestones

Our delivery roadmap spans design sign-off through 1.0 hardening. Track milestone progress and task
assignments in [`TASKS.md`](https://github.com/react-gtm-kit/react-gtm-kit/blob/main/TASKS.md).
