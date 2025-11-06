import type { DefaultTheme, UserConfig } from 'vitepress';

const sidebar: DefaultTheme.Sidebar = {
  '/how-to/': [
    {
      text: 'How-to Guides',
      items: [
        { text: 'Consent Mode integration', link: '/how-to/consent' },
        { text: 'Enterprise consent patterns', link: '/how-to/enterprise-consent' },
        { text: 'React legacy adapter', link: '/how-to/react-legacy-adapter' },
        { text: 'React Router pageviews', link: '/how-to/react-router' },
        { text: 'Server-side integration', link: '/how-to/server-integration' },
        { text: 'SSR and CSP setup', link: '/how-to/ssr' }
      ]
    }
  ],
  '/design/': [
    {
      text: 'Design Docs',
      items: [
        { text: 'API sign-off', link: '/design/api-signoff' },
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
        { text: 'Risk log', link: '/governance/risk-log' },
        { text: 'Security review', link: '/governance/security-review' },
        { text: 'Contributing guide', link: '/governance/contributing' }
      ]
    }
  ],
  '/reference/': [
    {
      text: 'API Reference',
      items: [{ text: 'Event helpers', link: '/reference/events' }]
    }
  ],
  '/releases/': [
    {
      text: 'Releases',
      items: [{ text: 'Alpha notes', link: '/releases/alpha' }]
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
      { text: 'How-to Guides', link: '/how-to/consent' },
      { text: 'Reference', link: '/reference/events' },
      { text: 'Governance', link: '/governance/OWNERS' }
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
