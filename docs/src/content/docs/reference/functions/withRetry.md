---
editUrl: false
next: false
prev: false
title: "withRetry"
---

> **withRetry**\<`T`\>(`fn`, `opts?`): `Promise`\<`T`\>

Defined in: [packages/core/src/retry/RetryHandler.ts:32](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/retry/RetryHandler.ts#L32)

Wraps an async operation with retry logic.

## Type Parameters

### T

`T`

## Parameters

### fn

() => `Promise`\<`T`\>

### opts?

[`RetryOptions`](/forge-clients/reference/interfaces/retryoptions/) = `{}`

## Returns

`Promise`\<`T`\>

## Example

```ts
const issue = await withRetry(
  () => getIssue(client, { issueIdOrKey: 'PROJ-123' }),
  { maxRetries: 3 },
);
```
