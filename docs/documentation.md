---
layout: doc
aside: true
---

# Overview

Axflow is a collection of modules for building robust natural language powered applications. These modules can be adopted incrementally, thus providing a modular and scalable end-to-end solution.
Used together, they form an end-to-end framework for developing AI applications.

::: info
@axflow/models is out of beta! Try it today https://www.npmjs.com/package/@axflow/models
:::

## Philosophy

Axflow aspires to deconstruct the complex paradigms of working with LLMs into manageable and intuitive components.
Our library takes a code-first approach, emphasizing the importance of flexibility and control for developers.
As a foundational framework, Axflow empowers developers to build higher-level TypeScript AI features and products seamlessly.

## Modules

- [@axflow/models](/documentation/models.md): Zero-dependency, modular SDK for building robust natural language applications. Includes React hooks and streaming utilities that make building AI applications a breeze.
- [axgen](/documentation/axgen.md): A framework for connecting your data to large language models
- [axeval](/documentation/axeval.md): A framework for evaluating LLM output quality

## Getting started

The modules can be installed independently, for incremental adoption and bundle size minimization.

```
npm install @axflow/models
npm install axgen
npm install axeval
```

## Examples

Here is an example [open source UI](https://github.com/axflow/original-demo-ui) showcasing what our first module, axgen, can do, with a [short video](https://www.loom.com/share/458f9b6679b740f0a5c78a33fffee3dc) walkthrough.

## License

[MIT](LICENSE.md)
