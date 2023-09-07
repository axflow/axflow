# @axflow/models/react

React hooks for building client applications.

```ts
import {useChat} from '@axflow/models/react';
import type {UseChatOptionsType, UseChatResultType} from '@axflow/models/react';
```

## `useChat`

The guide [Building client applications](/guides/models/building-client-applications.md) covers this in detail.

```ts
/**
 * A React hook to power LLM chat applications.
 *
 * This hook supports streaming and non-streaming responses. If streaming, the API
 * response must have a content-type header set to `application/x-ndjson; charset=utf-8`.
 * Additionally, it must send its JSON chunks using the following format:
 *
 *     { type: 'data' | 'chunk', value: <any valid JSON value> }
 *
 * When `type` is `chunk`, `value` represents a chunk of the source stream. When `type`
 * is `data`, `value` represents any additional data sent along with the source stream.
 *
 * @param options UseChatOptionsType
 * @returns UseChatResultType
 */
declare function useChat(
  options?: UseChatOptionsType
): UseChatResultType;
```
