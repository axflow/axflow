import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/openai/chat.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist/openai',
    external: [/^@axflow\/models\//],
    dts: true,
  },
  {
    entry: ['src/openai/completion.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist/openai',
    external: [/^@axflow\/models\//],
    dts: true,
  },
  {
    entry: ['src/openai/embedding.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist/openai',
    external: [/^@axflow\/models\//],
    dts: true,
  },
  {
    entry: ['src/anthropic/completion.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist/anthropic',
    external: [/^@axflow\/models\//],
    dts: true,
  },
  {
    entry: ['src/cohere/generation.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist/cohere',
    external: [/^@axflow\/models\//],
    dts: true,
  },
  {
    entry: ['src/cohere/embedding.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist/cohere',
    external: [/^@axflow\/models\//],
    dts: true,
  },
  {
    entry: ['src/react/index.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist/react',
    external: [/^@axflow\/models\//],
    dts: true,
  },
  {
    entry: ['src/shared/index.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist/shared',
    external: [/^@axflow\/models\//],
    dts: true,
  },
]);
