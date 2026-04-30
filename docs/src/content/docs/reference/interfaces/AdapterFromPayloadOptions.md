---
editUrl: false
next: false
prev: false
title: "AdapterFromPayloadOptions"
---

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:93](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeInvocationPayload.ts#L93)

Options for the adapterFromForgePayload() factory function.

## Extends

- `Omit`\<[`ForgeRemoteAdapterOptions`](/forge-clients/reference/interfaces/forgeremoteadapteroptions/), `"installationId"` \| `"appSystemToken"` \| `"proxyUrl"` \| `"product"`\>

## Properties

### proxyUrl?

> `optional` **proxyUrl?**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:99](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeInvocationPayload.ts#L99)

Override the egress proxy URL. Defaults to process.env.FORGE_EGRESS_PROXY_URL.
Useful for testing with a mock proxy.
