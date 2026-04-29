---
editUrl: false
next: false
prev: false
title: "MockForgeAdapter"
---

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:57](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L57)

A test double for [ForgeAdapter](/forge-clients/reference/interfaces/forgeadapter/) that records all calls and returns
configurable responses from a FIFO queue.

This is the primary tool for unit testing generated client functions
without a real Forge runtime or network connection.

Responses are dequeued in the order they were queued. If the queue is empty,
a default `200 OK` with `{}` body is returned. Errors queued via
`queueThrow()` are thrown before checking the response queue.

## Example

```typescript
import { MockForgeAdapter, asApp } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

const mock = new MockForgeAdapter('jira');
mock.queueResponse({ id: '123', key: 'PROJ-1', fields: {} });

const client = asApp(mock);
const issue = await getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });

expect(mock.callCount).toBe(1);
expect(mock.getLastCall()?.path).toBe('/rest/api/3/issue/PROJ-1');
```

## Implements

- [`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/)

## Constructors

### Constructor

> **new MockForgeAdapter**(`product?`): `MockForgeAdapter`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:68](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L68)

Create a new MockForgeAdapter.

#### Parameters

##### product?

`"jira"` \| `"confluence"`

The Atlassian product to simulate (default: `'jira'`)

#### Returns

`MockForgeAdapter`

## Properties

### product

> `readonly` **product**: `"jira"` \| `"confluence"`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:58](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L58)

The Atlassian product this adapter is configured to make requests to

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`product`](/forge-clients/reference/interfaces/forgeadapter/#product)

## Accessors

### callCount

#### Get Signature

> **get** **callCount**(): `number`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:107](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L107)

The total number of calls made to `fetch()` since the last `reset()`

##### Returns

`number`

## Methods

### fetch()

> **fetch**(`options`): `Promise`\<`Response`\>

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:72](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L72)

Execute an HTTP request and return a standard `Response`.
Implementations are responsible for authentication header injection,
URL construction, and serialisation.

#### Parameters

##### options

[`ForgeRequestOptions`](/forge-clients/reference/interfaces/forgerequestoptions/)

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`fetch`](/forge-clients/reference/interfaces/forgeadapter/#fetch)

***

### getCall()

> **getCall**(`index`): [`RecordedCall`](/forge-clients/reference/interfaces/recordedcall/) \| `undefined`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:105](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L105)

Returns the recorded call at the given zero-based index, or `undefined` if out of range

#### Parameters

##### index

`number`

#### Returns

[`RecordedCall`](/forge-clients/reference/interfaces/recordedcall/) \| `undefined`

***

### getCalls()

> **getCalls**(): [`RecordedCall`](/forge-clients/reference/interfaces/recordedcall/)[]

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:101](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L101)

Returns a copy of all recorded calls in the order they were made

#### Returns

[`RecordedCall`](/forge-clients/reference/interfaces/recordedcall/)[]

***

### getLastCall()

> **getLastCall**(): [`RecordedCall`](/forge-clients/reference/interfaces/recordedcall/) \| `undefined`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:103](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L103)

Returns the most recent recorded call, or `undefined` if no calls have been made

#### Returns

[`RecordedCall`](/forge-clients/reference/interfaces/recordedcall/) \| `undefined`

***

### queueErrorResponse()

> **queueErrorResponse**(`status`, `body?`): `this`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:131](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L131)

Queue a non-2xx error response

#### Parameters

##### status

`number`

##### body?

`unknown` = `{}`

#### Returns

`this`

***

### queueNoContent()

> **queueNoContent**(): `this`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:142](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L142)

Queue a 204 No Content response

#### Returns

`this`

***

### queueResponse()

> **queueResponse**(`body`, `status?`): `this`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:120](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L120)

Queue a successful JSON response (FIFO order)

#### Parameters

##### body

`unknown`

##### status?

`number` = `200`

#### Returns

`this`

***

### queueThrow()

> **queueThrow**(`error?`): `this`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:148](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L148)

Queue a network-level error (fetch throws, no Response)

#### Parameters

##### error?

`Error` = `...`

#### Returns

`this`

***

### reset()

> **reset**(): `this`

Defined in: [packages/core/src/test-utils/MockForgeAdapter.ts:110](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/test-utils/MockForgeAdapter.ts#L110)

Reset all recorded calls and queued responses

#### Returns

`this`
