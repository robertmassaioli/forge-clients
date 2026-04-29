---
editUrl: false
next: false
prev: false
title: "ForgeRemoteAdapterOptions"
---

Defined in: [packages/core/src/adapters/ForgeRemoteAdapter.ts:53](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeRemoteAdapter.ts#L53)

## Properties

### appSystemToken

> **appSystemToken**: `string`

Defined in: [packages/core/src/adapters/ForgeRemoteAdapter.ts:75](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeRemoteAdapter.ts#L75)

The app system token for this invocation.
Provided in every Forge Remote invocation payload as `appSystemToken`.
Used in the `forge-proxy-authorization` header for asApp requests.

***

### installationId

> **installationId**: `string`

Defined in: [packages/core/src/adapters/ForgeRemoteAdapter.ts:68](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeRemoteAdapter.ts#L68)

The installation ID for this app installation.
Provided in every Forge Remote invocation payload as `installationId`.

***

### product

> **product**: `"jira"` \| `"confluence"`

Defined in: [packages/core/src/adapters/ForgeRemoteAdapter.ts:55](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeRemoteAdapter.ts#L55)

Which Atlassian product to make requests to

***

### proxyUrl

> **proxyUrl**: `string`

Defined in: [packages/core/src/adapters/ForgeRemoteAdapter.ts:62](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeRemoteAdapter.ts#L62)

The Forge egress proxy URL.
In a Forge Remote, this is available via the environment variable
FORGE_EGRESS_PROXY_URL injected by the Forge runtime into the invocation.
