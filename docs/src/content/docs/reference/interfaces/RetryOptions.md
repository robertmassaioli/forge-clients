---
editUrl: false
next: false
prev: false
title: "RetryOptions"
---

Defined in: [packages/core/src/retry/RetryHandler.ts:10](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/retry/RetryHandler.ts#L10)

## Properties

### backoffFactor?

> `optional` **backoffFactor?**: `number`

Defined in: [packages/core/src/retry/RetryHandler.ts:16](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/retry/RetryHandler.ts#L16)

Multiplier applied to delay after each retry (default: 2)

***

### initialDelayMs?

> `optional` **initialDelayMs?**: `number`

Defined in: [packages/core/src/retry/RetryHandler.ts:14](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/retry/RetryHandler.ts#L14)

Initial delay in milliseconds before first retry (default: 1000)

***

### maxRetries?

> `optional` **maxRetries?**: `number`

Defined in: [packages/core/src/retry/RetryHandler.ts:12](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/retry/RetryHandler.ts#L12)

Maximum number of retry attempts (default: 3)

***

### onRetry?

> `optional` **onRetry?**: (`attempt`, `error`, `delayMs`) => `void`

Defined in: [packages/core/src/retry/RetryHandler.ts:20](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/retry/RetryHandler.ts#L20)

Optional callback invoked before each retry

#### Parameters

##### attempt

`number`

##### error

[`ForgeApiError`](/forge-clients/reference/classes/forgeapierror/)

##### delayMs

`number`

#### Returns

`void`

***

### retryOn?

> `optional` **retryOn?**: `number`[]

Defined in: [packages/core/src/retry/RetryHandler.ts:18](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/retry/RetryHandler.ts#L18)

HTTP status codes that should trigger a retry (default: [429, 503])
