---
editUrl: false
next: false
prev: false
title: "ForgeBridgeAdapter"
---

Defined in: [packages/core/src/adapters/ForgeBridgeAdapter.ts:34](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeBridgeAdapter.ts#L34)

Adapter for UI Kit 2 and Custom UI frontend contexts.
Uses `@forge/bridge` to route requests through the Forge runtime.
All requests are authenticated as the currently logged-in user.

## Implements

- [`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/)

## Constructors

### Constructor

> **new ForgeBridgeAdapter**(`options`): `ForgeBridgeAdapter`

Defined in: [packages/core/src/adapters/ForgeBridgeAdapter.ts:41](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeBridgeAdapter.ts#L41)

Create a new ForgeBridgeAdapter.

#### Parameters

##### options

[`ForgeBridgeAdapterOptions`](/forge-clients/reference/interfaces/forgebridgeadapteroptions/)

Configuration options including the target product

#### Returns

`ForgeBridgeAdapter`

## Properties

### product

> `readonly` **product**: `"jira"` \| `"confluence"`

Defined in: [packages/core/src/adapters/ForgeBridgeAdapter.ts:35](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeBridgeAdapter.ts#L35)

The Atlassian product this adapter is configured to make requests to

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`product`](/forge-clients/reference/interfaces/forgeadapter/#product)

## Methods

### fetch()

> **fetch**(`options`): `Promise`\<`Response`\>

Defined in: [packages/core/src/adapters/ForgeBridgeAdapter.ts:49](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeBridgeAdapter.ts#L49)

Execute a request via `@forge/bridge` (requestJira or requestConfluence).
The request is automatically authenticated as the logged-in user.

#### Parameters

##### options

[`ForgeRequestOptions`](/forge-clients/reference/interfaces/forgerequestoptions/)

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`fetch`](/forge-clients/reference/interfaces/forgeadapter/#fetch)
