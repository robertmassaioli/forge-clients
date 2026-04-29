---
editUrl: false
next: false
prev: false
title: "ForgeInvocationPayload"
---

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:54](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L54)

The top-level Forge Remote invocation payload.

This represents what Forge sends as the request body when calling your
Remote backend. The payload is signed and verified by Forge before delivery.

Note: This type covers the fields documented by Atlassian. The actual payload
may contain additional undocumented fields that vary by invocation context.

## Indexable

> \[`key`: `string`\]: `unknown`

Additional properties — Forge may include extra fields depending on
the invocation context and module type.

## Properties

### appSystemToken

> **appSystemToken**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:70](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L70)

Short-lived app system token for authenticating requests through the
Forge egress proxy (FORGE_EGRESS_PROXY_URL).

This token:
- Is specific to this invocation
- Has a short TTL (typically minutes, not hours)
- Must be passed in the `forge-proxy-authorization` header

***

### context

> **context**: [`ForgeInvocationContext`](/forge-clients/reference/interfaces/forgeinvocationcontext/)

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:75](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L75)

Invocation context — user, site, and app information.

***

### installationId

> **installationId**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:59](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L59)

The installation ID for this app installation.
Use this to identify which installation is making the request.

***

### payload?

> `optional` **payload?**: `unknown`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:81](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L81)

The payload sent by the Forge module that triggered this invocation.
Shape depends on the module type (webtrigger, custom-ui, etc.)
