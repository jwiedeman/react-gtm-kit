# Launch Marketing Plan

This plan orchestrates the marketing and developer relations rollout for the React GTM Kit 1.0
launch. It aligns content, channels, and owners so the release narrative lands consistently across
blog, social, and conference touchpoints.

## Objectives & KPIs

| Objective                                      | KPI                                            | Target                                |
| ---------------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| Drive awareness with existing GTM adopters     | Launch blog post views                         | 5k unique views in first 14 days      |
| Activate React community                       | Social engagements (likes + reposts + replies) | 1.5k combined across platforms        |
| Secure qualified leads for enterprise adoption | Demo requests via contact form                 | 50 requests in first 30 days          |
| Establish thought leadership                   | Conference CFP acceptances                     | 2 acceptances for Q1 developer events |

## Audience Segments

- **React leads and staff engineers**: evaluating instrumentation strategies, focus on integration
  speed and reliability.
- **Marketing operations teams**: want governance, consent, and compliance assurances.
- **Developer advocates & content creators**: need a compelling story that differentiates GTM Kit
  from boilerplate snippets.

## Messaging Pillars

1. **Production-grade foundation** – multi-container, Consent Mode v2, SSR/CSP handling out of the box.
2. **Task-based documentation & examples** – copy-paste guides and runnable demos accelerate adoption.
3. **Enterprise readiness** – governance, size/perf budgets, and release automation already wired.

Each asset should lead with the primary pillar and reinforce the other two with concrete proof points
(code snippets, docs links, test coverage stats).

## Timeline

| Phase       | Window      | Deliverables                                                                           | Owner                |
| ----------- | ----------- | -------------------------------------------------------------------------------------- | -------------------- |
| Teaser      | T-21 → T-14 | Internal alignment, teaser social copy, CFP outreach kick-off                          | DevRel lead          |
| Warm-up     | T-13 → T-7  | Draft blog post, record demo gif, produce deck outline, confirm KPIs dashboard         | Product marketing    |
| Launch week | T-6 → T+1   | Publish blog, release docs updates, run Twitter/LinkedIn threads, host livestream demo | Joint (DevRel + PMM) |
| Post-launch | T+2 → T+30  | Recap newsletter, gather case studies, monitor KPIs & iterate campaigns                | Growth lead          |

`T` represents the planned launch date for the 1.0 announcement. Owners are documented in
[`docs/governance/OWNERS.md`](../governance/OWNERS.md).

## Channel Plan

### Blog

- **Format**: Long-form post (~1,500 words) on the company engineering blog.
- **Outline**:
  1. The instrumentation problem React teams face (StrictMode, Consent Mode, SSR).
  2. How React GTM Kit solves it (core, adapters, examples, docs).
  3. Real-world workflow walkthrough (consent banner + Next App Router + server relay).
  4. Call-to-action: clone examples, read docs, join community channel.
- **Assets**: Feature graphic (hero), architecture diagram, animated gif of consent flow, inline
  code snippets for init and event pushes.

### Social

- **Twitter/X thread** (8 tweets): lead with problem, highlight docs + examples, end with CTA.
- **LinkedIn post**: emphasise enterprise readiness and consent compliance.
- **Dev.to / Hashnode cross-post**: trimmed blog variant linking back to main announcement.
- Draft copy lives in [`social-copy.md`](./social-copy.md); update with tracked URLs once available.

### Conference & Livestream

- Submit the abstract in [`conference-abstract.md`](./conference-abstract.md) to React-focused events
  (React Summit, React Miami) and instrumentation-centric meetups.
- Host a launch livestream (30 minutes) featuring a walkthrough of the examples + consent flow.
- Repurpose livestream recording into YouTube chaptered tutorial and embed on docs landing page.

## Asset Checklist

| Asset                  | Status               | Notes                                                              |
| ---------------------- | -------------------- | ------------------------------------------------------------------ |
| Launch blog post draft | In progress          | Owner: PMM. Draft in shared doc; convert to Markdown for blog CMS. |
| Social copy            | Ready for approval   | Stored in `social-copy.md`; awaiting tracked URLs.                 |
| Conference abstract    | Ready for submission | Align submission deadlines in `conference-abstract.md`.            |
| Launch deck            | Outline complete     | Slides enumerated in `launch-deck-outline` section below.          |
| Docs callouts          | Ready                | Docs PR adds marketing CTA to landing page (pending).              |
| KPI dashboard          | Pending              | Growth team wiring analytics board in Looker.                      |

## Launch Deck Outline

The deck should follow this outline. Each bullet represents a slide.

1. Title: "React GTM Kit 1.0 – Production-ready tagging for React."
2. Problem framing – instrumentation chaos across React eras.
3. Solution overview – core + adapters + examples.
4. Key capabilities – Consent Mode, multi-container, SSR/CSP, observability.
5. Architecture diagram – data layer flow across client/server.
6. Developer experience – task-based docs, smoke-tested examples.
7. Enterprise guardrails – size budgets, coverage, governance.
8. Migration path – from snippets to GTM Kit, compatibility matrix.
9. Call-to-action – install packages, explore docs, join community.
10. Appendix – roadmap highlights and contribution links.

## Reporting & KPIs

- **Dashboard ownership**: Growth lead maintains Looker dashboard with daily ingestion.
- **Cadence**: Review metrics in weekly stand-up; share summary in monthly stakeholder update.
- **Attribution**: Use UTM-tagged URLs across blog and social; align with CRM for demo requests.
- **Feedback loop**: Capture qualitative feedback (GitHub issues, community chat) and fold into
  docs/examples backlog via GitHub issues.

## Risks & Mitigations

| Risk                                       | Mitigation                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| Launch assets slip due to review bandwidth | Set internal review deadlines 48 hours before external publication.     |
| KPIs are not met in first week             | Line up booster campaigns (community newsletter, partner tweet) at T+7. |
| Messaging drifts across channels           | Maintain single source of truth in this plan and cross-review copy.     |

## Next Steps

1. Confirm launch date and align `T` timeline with the team.
2. Assign asset owners via GitHub issues if additional help is required.
3. Populate KPI dashboard and share preview in the week-before sync.
4. Kick off outreach for conference CFPs using the prepared abstract.
