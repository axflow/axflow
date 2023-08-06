<p align="center">
  <img src="./assets/logo.png" />
</p>

# Ax — A comprehensive AI framework for TypeScript

Ax is a collection of modules designed for creating robust AI applications. These modules can be adopted incrementally, thus providing a modular and scalable end-to-end solution.
Used together, they form an end-to-end framework for developing AI applications.

# Modules

- [axgen](./packages/axgen/): A framework for connecting your data to large language models
- [axeval](./packages/axeval/): A framework for evaluating LLM output quality

In addition to the above modules, we're working on the following modules:

- axextract: A library for efficient data processing, particularly loading, transforming, and chunking documents from arbitrary sources. Most useful for applications that need to load and preprocess data for vector search.
- axserve: A serving framework to run any LLM model (OSS or otherwise). It will also provide middleware options for user throttling, analytics, and logging
- axtune: A library focused on fine-tuning models

## [Documentation](https://docs.axilla.io)

# Installation

The modules can be installed independently, for incremental adoption and bundle size minimization.

```
npm install axgen
npm install axeval
```

# Goals

Ax aspires to deconstruct the complex paradigms of working with LLMs into manageable and intuitive components.
Our library takes a code-first approach, emphasizing the importance of flexibility and control for developers.
As a foundational framework, Ax empowers developers to build higher-level TypeScript AI features and products seamlessly.

## Examples

Here is an example [open source UI](https://github.com/axilla-io/demo-ui) showcasing what axgen can do, with a [short video](https://www.loom.com/share/458f9b6679b740f0a5c78a33fffee3dc) walkthrough.

## License

[MIT](LICENSE.md)
