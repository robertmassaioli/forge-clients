---
editUrl: false
next: false
prev: false
title: "withRetry"
---

> **withRetry**\<`T`\>(`fn`, `opts?`): `Promise`\<`T`\>

Defined in: [packages/core/src/retry/RetryHandler.ts:32](https://github.com/robertmassaioli/forge-clients/blob/3f7c32ba25aedbdd980cdc60fc4d14b74ddfa0e2/packages/core/src/retry/RetryHandler.ts#L32)

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
