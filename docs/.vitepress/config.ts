import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Axflow documentation',
  description: 'The TypeScript framework for AI development',
  head: [
    [
      'script',
      {
        src: 'https://plausible.io/js/script.js',
        async: '',
        defer: '',
        'data-domain': 'docs.axflow.dev',
      },
    ],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      light: '/teal400-ax.svg',
      dark: '/teal200-ax.svg',
    },
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
              {
                text: 'Models',
                collapsed: true,
                link: '/documentation/models',
                items: [
                  { text: 'OpenAIChat', link: '/documentation/models/openai-chat' },
                  { text: 'OpenAICompletion', link: '/documentation/models/openai-completion' },
                  { text: 'OpenAIEmbedding', link: '/documentation/models/openai-embedding' },
                  { text: 'AzureOpenAIChat', link: '/documentation/models/azure-openai-chat' },
                  {
                    text: 'AnthropicCompletion',
                    link: '/documentation/models/anthropic-completion',
                  },
                  {
                    text: 'HuggingFaceTextGeneration',
                    link: '/documentation/models/huggingface-text-generation',
                  },
                  { text: 'CohereGeneration', link: '/documentation/models/cohere-generation' },
                  { text: 'CohereEmbedding', link: '/documentation/models/cohere-embedding' },
                  { text: 'OllamaGeneration', link: '/documentation/models/ollama-generation' },
                  { text: 'OllamaEmbedding', link: '/documentation/models/ollama-embedding' },
                  { text: 'React', link: '/documentation/models/react' },
                  { text: 'Node', link: '/documentation/models/node' },
                  { text: 'Shared', link: '/documentation/models/shared' },
                ],
              },
            ],
          },
          {
            text: 'Guides',
            link: '/guides',
            items: [
              {
                text: 'Models',
                collapsed: true,
                items: [
                  { text: 'Getting started', link: '/guides/models/getting-started' },
                  { text: 'Streaming', link: '/guides/models/streaming' },
                  {
                    text: 'Building client applications',
                    link: '/guides/models/building-client-applications',
                  },
                  {
                    text: 'Bring your own models',
                    link: '/guides/models/bring-your-own-models',
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
      { icon: 'github', link: 'https://github.com/axflow/axflow' },
      { icon: 'twitter', link: 'https://twitter.com/axflow_dev' },
      {
        icon: 'slack',
        link: 'https://join.slack.com/t/axilladevelopers/shared_invite/zt-20j9zofkl-gA3EO3O4N1t8~PJTvv7TQg',
      },
      { icon: 'linkedin', link: 'https://www.linkedin.com/company/96310770/' },
    ],
  },
});
