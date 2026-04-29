---
editUrl: false
next: false
prev: false
title: "ForgeFunctionAdapter"
---

Defined in: [packages/core/src/adapters/ForgeFunctionAdapter.ts:54](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeFunctionAdapter.ts#L54)

Adapter for Forge Functions (serverless backend).

Uses `@forge/api`'s `requestJira` / `requestConfluence` methods, which handle
all Forge authentication automatically. This is the most common adapter for
backend Forge apps.

**Not available in Forge Containers** — use [ForgeContainerAdapter](/forge-clients/reference/classes/forgecontaineradapter/) there.

## Example

```typescript
import { ForgeFunctionAdapter, asApp, asUser } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });

const appClient = asApp(adapter);
const issue = await getIssue(appClient, { path: { issueIdOrKey: 'PROJ-1' } });

const userClient = asUser(adapter);
const me = await getMyself(userClient);
```

## Implements

- [`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/)

## Constructors

### Constructor

> **new ForgeFunctionAdapter**(`options`): `ForgeFunctionAdapter`

Defined in: [packages/core/src/adapters/ForgeFunctionAdapter.ts:62](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeFunctionAdapter.ts#L62)

Create a new ForgeFunctionAdapter.

#### Parameters

##### options

[`ForgeFunctionAdapterOptions`](/forge-clients/reference/interfaces/forgefunctionadapteroptions/)

Configuration including the target product and optional default auth context

#### Returns

`ForgeFunctionAdapter`

## Properties

### product

> `readonly` **product**: `"jira"` \| `"confluence"`

Defined in: [packages/core/src/adapters/ForgeFunctionAdapter.ts:55](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeFunctionAdapter.ts#L55)

The Atlassian product this adapter is configured to make requests to

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`product`](/forge-clients/reference/interfaces/forgeadapter/#product)

## Methods

### fetch()

> **fetch**(`options`): `Promise`\<`Response`\>

Defined in: [packages/core/src/adapters/ForgeFunctionAdapter.ts:71](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeFunctionAdapter.ts#L71)

Execute a request via `@forge/api` (requestJira or requestConfluence).
Authentication is handled automatically by the Forge runtime.

#### Parameters

##### options

[`ForgeRequestOptions`](/forge-clients/reference/interfaces/forgerequestoptions/)

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`fetch`](/forge-clients/reference/interfaces/forgeadapter/#fetch)
