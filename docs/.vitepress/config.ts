import type { DefaultTheme, UserConfig } from 'vitepress';

const sidebar: DefaultTheme.Sidebar = {
  '/how-to/': [
    {
      text: 'How-to Guides',
      items: [
        { text: 'Initialize React GTM Kit', link: '/how-to/setup' },
        { text: 'Migrate from existing GTM setups', link: '/how-to/migration' },
        { text: 'Debug GTM integrations', link: '/how-to/debugging' },
        { text: 'Send analytics events', link: '/how-to/analytics-integration' },
        { text: 'Track GA4 ecommerce', link: '/how-to/ga4-ecommerce' },
        { text: 'Consent Mode integration', link: '/how-to/consent' },
        { text: 'Enterprise consent patterns', link: '/how-to/enterprise-consent' },
        { text: 'CMP integration & QA', link: '/how-to/cmp-integration' },
        { text: 'React legacy adapter', link: '/how-to/react-legacy-adapter' },
        { text: 'React Router pageviews', link: '/how-to/react-router' },
        { text: 'Multi-container custom hosts', link: '/how-to/multi-container-custom-hosts' },
        { text: 'Server-side integration', link: '/how-to/server-integration' },
        { text: 'SSR and CSP setup', link: '/how-to/ssr' },
        { text: 'SSR noscript + CSP nonces', link: '/how-to/ssr-noscript-csp' },
        { text: 'Keep bundles lightweight', link: '/how-to/optimization' },
        { text: 'Examples & smoke tests', link: '/how-to/examples' },
        { text: 'Troubleshooting & FAQ', link: '/how-to/troubleshooting' }
      ]
    }
  ],
  '/concepts/': [
    {
      text: 'Concepts',
      items: [
        { text: 'Architecture overview', link: '/concepts/architecture' },
        { text: 'Consent lifecycle', link: '/concepts/consent-lifecycle' },
        { text: 'SSR strategy', link: '/concepts/ssr-strategy' }
      ]
    }
  ],
  '/design/': [
    {
      text: 'Design Docs',
      items: [
        { text: 'API sign-off', link: '/design/api-signoff' },
        { text: 'Tracking matrix', link: '/design/tracking-matrix' },
        { text: 'Decisions log', link: '/design/DECISIONS' }
      ]
    }
  ],
  '/governance/': [
    {
      text: 'Governance',
      items: [
        { text: 'Engineering principles', link: '/governance/engineering-principles' },
        { text: 'OWNERS', link: '/governance/OWNERS' },
        { text: 'Privacy guidance', link: '/governance/privacy' },
        { text: 'DPIA & consent evidence', link: '/governance/dpia' },
        { text: 'Risk log', link: '/governance/risk-log' },
        { text: 'Security review', link: '/governance/security-review' },
        { text: 'Operability plan', link: '/governance/operability' },
        { text: 'Support runbook', link: '/governance/support-runbook' },
        { text: 'Maintenance cadence', link: '/governance/maintenance' },
        { text: 'Contributing guide', link: '/governance/contributing' },
        { text: 'Release process', link: '/governance/release-process' },
        { text: 'Release checklist', link: '/governance/release-checklist' }
      ]
    }
  ],
  '/reference/': [
    {
      text: 'API Reference',
      items: [
        { text: 'Public API surface', link: '/reference/api' },
        { text: 'Event helpers', link: '/reference/events' }
      ]
    }
  ],
  '/releases/': [
    {
      text: 'Releases',
      items: [{ text: 'Alpha notes', link: '/releases/alpha' }]
    }
  ],
  '/marketing/': [
    {
      text: 'Marketing & DevRel',
      items: [
        { text: 'Launch plan', link: '/marketing/launch-plan' },
        { text: 'Social copy', link: '/marketing/social-copy' },
        { text: 'Conference abstract', link: '/marketing/conference-abstract' }
      ]
    }
  ],
  '/': [
    {
      text: 'Overview',
      items: [
        { text: 'Project charter', link: '/#project-charter' },
        { text: 'Scope & non-goals', link: '/#scope--non-goals' },
        { text: 'Functional requirements', link: '/#functional-requirements' },
        { text: 'Milestones', link: '/#milestones' }
      ]
    }
  ]
};

const config: UserConfig = {
  title: 'React GTM Kit',
  description: 'Production-grade Google Tag Manager tooling for modern React stacks.',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Getting Started', link: '/' },
      { text: 'Concepts', link: '/concepts/architecture' },
      { text: 'How-to Guides', link: '/how-to/consent' },
      { text: 'Reference', link: '/reference/api' },
      { text: 'Governance', link: '/governance/OWNERS' },
      { text: 'Marketing', link: '/marketing/launch-plan' }
    ],
    sidebar,
    socialLinks: [{ icon: 'github', link: 'https://github.com/react-gtm-kit/react-gtm-kit' }],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 React GTM Kit maintainers'
    }
  }
};

export default config;
