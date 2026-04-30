---
editUrl: false
next: false
prev: false
title: "ForgeRemoteAdapter"
---

Defined in: [packages/core/src/adapters/ForgeRemoteAdapter.ts:91](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeRemoteAdapter.ts#L91)

Adapter for Forge Remote backends.

A Forge Remote is a stateless, externally-hosted service (your own server,
AWS Lambda, Cloud Run, etc.) that Forge calls via a declared `remote` module
in `manifest.yml`. Unlike [ForgeContainerAdapter](/forge-clients/reference/classes/forgecontaineradapter/), the `installationId`
and `appSystemToken` are provided fresh in every inbound invocation payload —
you do not need to fetch them at startup.

For the simplest setup, use [adapterFromForgePayload](/forge-clients/reference/functions/adapterfromforgepayload/) to create an adapter
directly from the invocation payload.

## Implements

- [`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/)

## Constructors

### Constructor

> **new ForgeRemoteAdapter**(`options`): `ForgeRemoteAdapter`

Defined in: [packages/core/src/adapters/ForgeRemoteAdapter.ts:101](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeRemoteAdapter.ts#L101)

Create a new ForgeRemoteAdapter.

#### Parameters

##### options

[`ForgeRemoteAdapterOptions`](/forge-clients/reference/interfaces/forgeremoteadapteroptions/)

Configuration including product, proxy URL, installation ID, and app system token

#### Returns

`ForgeRemoteAdapter`

## Properties

### product

> `readonly` **product**: `"jira"` \| `"confluence"`

Defined in: [packages/core/src/adapters/ForgeRemoteAdapter.ts:92](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeRemoteAdapter.ts#L92)

The Atlassian product this adapter is configured to make requests to

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`product`](/forge-clients/reference/interfaces/forgeadapter/#product)

## Methods

### fetch()

> **fetch**(`options`): `Promise`\<`Response`\>

Defined in: [packages/core/src/adapters/ForgeRemoteAdapter.ts:112](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeRemoteAdapter.ts#L112)

Execute a request through the Forge egress proxy.
Injects `forge-proxy-authorization` header with the app system token and installation ID.

#### Parameters

##### options

[`ForgeRequestOptions`](/forge-clients/reference/interfaces/forgerequestoptions/)

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/).[`fetch`](/forge-clients/reference/interfaces/forgeadapter/#fetch)
