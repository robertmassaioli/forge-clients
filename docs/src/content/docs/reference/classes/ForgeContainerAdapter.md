---
editUrl: false
next: false
prev: false
title: "ForgeContainerAdapter"
---

Defined in: [packages/core/src/adapters/ForgeContainerAdapter.ts:51](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeContainerAdapter.ts#L51)

Adapter for Forge Container backends.
Routes requests through the Forge egress proxy using `forge-proxy-authorization` headers.

## Implements

- [`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/)

## Constructors

### Constructor

> **new ForgeContainerAdapter**(`options`): `ForgeContainerAdapter`

Defined in: [packages/core/src/adapters/ForgeContainerAdapter.ts:60](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeContainerAdapter.ts#L60)

Create a new ForgeContainerAdapter.

#### Parameters

##### options

[`ForgeContainerAdapterOptions`](/forge-clients/reference/interfaces/forgecontaineradapteroptions/)

Configuration including product, proxy URL, and installation ID

#### Returns

`ForgeContainerAdapter`

## Properties

### product

> `readonly` **product**: `"jira"` \| `"confluence"`

Defined in: [packages/core/src/adapters/ForgeContainerAdapter.ts:52](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeContainerAdapter.ts#L52)

The Atlassian product this adapter is configured to make requests to

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`product`](/forge-clients/reference/interfaces/forgeadapter/#product)

## Methods

### fetch()

> **fetch**(`options`): `Promise`\<`Response`\>

Defined in: [packages/core/src/adapters/ForgeContainerAdapter.ts:70](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeContainerAdapter.ts#L70)

Execute a request through the Forge egress proxy.
Injects the appropriate `forge-proxy-authorization` header based on the auth context.

#### Parameters

##### options

[`ForgeRequestOptions`](/forge-clients/reference/interfaces/forgerequestoptions/)

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`fetch`](/forge-clients/reference/interfaces/forgeadapter/#fetch)
