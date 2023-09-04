import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Axilla documentation',
  description: 'Documentation for the Ax framework — write AI applications in TypeScript',
  head: [
    [
      'script',
      {
        src: 'https://plausible.io/js/script.js',
        async: '',
        defer: '',
        'data-domain': 'docs.axilla.io',
      },
    ],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: './logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/documentation' },
      { text: 'Guides', link: '/guides' },
      { text: 'Tutorials', link: '/tutorials' },
    ],

    sidebar: [
      {
        text: '',
        items: [
          {
            text: 'Documentation',
            link: '/documentation',
            items: [
              { text: 'Axgen', link: '/documentation/axgen' },
              { text: 'Axeval', link: '/documentation/axeval' },
              { text: 'Models', link: '/documentation/models' },
            ],
          },
          {
            text: 'Guides',
            link: '/guides',
            items: [
              {
                text: 'Models',
                items: [
                  { text: 'Getting started', link: '/guides/models/getting-started' },
                  { text: 'Streaming', link: '/guides/models/streaming' },
                  {
                    text: 'Building client applications',
                    link: '/guides/models/building-client-applications',
                  },
                  {
                    text: 'Bring your own models',
                    link: '/guides/models/building-client-applications',
                  },
                ],
              },
            ],
          },
          {
            text: 'Tutorials',
            link: '/tutorials',
            items: [{ text: 'Streaming chat app', link: '/tutorials/stream-chat-app' }],
          },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/axilla-io/ax' },
      { icon: 'twitter', link: 'https://twitter.com/axilla_io' },
      {
        icon: 'slack',
        link: 'https://join.slack.com/t/axilladevelopers/shared_invite/zt-20j9zofkl-gA3EO3O4N1t8~PJTvv7TQg',
      },
      { icon: 'linkedin', link: 'https://www.linkedin.com/company/96310770/' },
    ],
  },
});
