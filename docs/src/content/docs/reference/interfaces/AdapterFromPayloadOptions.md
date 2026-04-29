---
editUrl: false
next: false
prev: false
title: "AdapterFromPayloadOptions"
---

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:93](https://github.com/robertmassaioli/forge-clients/blob/3f7c32ba25aedbdd980cdc60fc4d14b74ddfa0e2/packages/core/src/adapters/ForgeInvocationPayload.ts#L93)

Options for the adapterFromForgePayload() factory function.

## Extends

- `Omit`\<[`ForgeRemoteAdapterOptions`](/forge-clients/reference/interfaces/forgeremoteadapteroptions/), `"installationId"` \| `"appSystemToken"` \| `"proxyUrl"` \| `"product"`\>

## Properties

### proxyUrl?

> `optional` **proxyUrl?**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:99](https://github.com/robertmassaioli/forge-clients/blob/3f7c32ba25aedbdd980cdc60fc4d14b74ddfa0e2/packages/core/src/adapters/ForgeInvocationPayload.ts#L99)

Override the egress proxy URL. Defaults to process.env.FORGE_EGRESS_PROXY_URL.
Useful for testing with a mock proxy.
