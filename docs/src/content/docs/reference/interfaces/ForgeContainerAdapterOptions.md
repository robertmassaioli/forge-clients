---
editUrl: false
next: false
prev: false
title: "ForgeContainerAdapterOptions"
---

Defined in: [packages/core/src/adapters/ForgeContainerAdapter.ts:32](https://github.com/robertmassaioli/forge-clients/blob/3f7c32ba25aedbdd980cdc60fc4d14b74ddfa0e2/packages/core/src/adapters/ForgeContainerAdapter.ts#L32)

Options for constructing a [ForgeContainerAdapter](/forge-clients/reference/classes/forgecontaineradapter/).

## Properties

### installationId

> **installationId**: `string`

Defined in: [packages/core/src/adapters/ForgeContainerAdapter.ts:44](https://github.com/robertmassaioli/forge-clients/blob/3f7c32ba25aedbdd980cdc60fc4d14b74ddfa0e2/packages/core/src/adapters/ForgeContainerAdapter.ts#L44)

The installation ID for this app installation.
Obtained at startup by calling `GET <proxyUrl>/v0/installations`.

***

### product

> **product**: `"jira"` \| `"confluence"`

Defined in: [packages/core/src/adapters/ForgeContainerAdapter.ts:34](https://github.com/robertmassaioli/forge-clients/blob/3f7c32ba25aedbdd980cdc60fc4d14b74ddfa0e2/packages/core/src/adapters/ForgeContainerAdapter.ts#L34)

The Atlassian product to make requests to

***

### proxyUrl

> **proxyUrl**: `string`

Defined in: [packages/core/src/adapters/ForgeContainerAdapter.ts:39](https://github.com/robertmassaioli/forge-clients/blob/3f7c32ba25aedbdd980cdc60fc4d14b74ddfa0e2/packages/core/src/adapters/ForgeContainerAdapter.ts#L39)

The Forge egress proxy URL.
Read from `process.env.FORGE_EGRESS_PROXY_URL` in the Forge Container runtime.
