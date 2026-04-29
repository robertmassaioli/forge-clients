---
editUrl: false
next: false
prev: false
title: "adapterFromForgePayload"
---

> **adapterFromForgePayload**(`payload`, `product`, `options?`): [`ForgeRemoteAdapter`](/forge-clients/reference/classes/forgeremoteadapter/)

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:125](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L125)

Create a ForgeRemoteAdapter from a Forge Remote invocation payload.

This is the recommended way to create an adapter in a Forge Remote handler —
it extracts `installationId` and `appSystemToken` from the payload automatically
and reads `FORGE_EGRESS_PROXY_URL` from the environment.

## Parameters

### payload

[`ForgeInvocationPayload`](/forge-clients/reference/interfaces/forgeinvocationpayload/)

The Forge Remote invocation payload

### product

`"jira"` \| `"confluence"`

The Atlassian product to make requests to

### options?

[`AdapterFromPayloadOptions`](/forge-clients/reference/interfaces/adapterfrompayloadoptions/)

Optional overrides (e.g. proxyUrl for testing)

## Returns

[`ForgeRemoteAdapter`](/forge-clients/reference/classes/forgeremoteadapter/)

## Example

```typescript
import { adapterFromForgePayload, type ForgeInvocationPayload } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

export async function handler(payload: ForgeInvocationPayload) {
  const client = adapterFromForgePayload(payload, 'jira');
  return getIssue(client, { issueIdOrKey: 'PROJ-123' });
}
```

## Throws

if FORGE_EGRESS_PROXY_URL is not set and no proxyUrl override is provided
