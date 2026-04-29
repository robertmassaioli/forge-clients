---
editUrl: false
next: false
prev: false
title: "ForgeInvocationContext"
---

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:28](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L28)

The context object within a Forge Remote invocation payload.
Contains information about the user and site that triggered the invocation.

## Properties

### accountId?

> `optional` **accountId?**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:30](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L30)

The Atlassian account ID of the user who triggered the invocation, if any

***

### appVersion?

> `optional` **appVersion?**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:40](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L40)

The app version

***

### cloudId?

> `optional` **cloudId?**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:32](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L32)

The Atlassian cloud ID of the site

***

### environmentId?

> `optional` **environmentId?**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:38](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L38)

The environment ID

***

### environmentType?

> `optional` **environmentType?**: `"DEVELOPMENT"` \| `"STAGING"` \| `"PRODUCTION"`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:36](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L36)

The environment type (development, staging, production)

***

### moduleKey?

> `optional` **moduleKey?**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:42](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L42)

The module key that was invoked

***

### siteUrl?

> `optional` **siteUrl?**: `string`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:34](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeInvocationPayload.ts#L34)

The site URL (e.g. https://your-site.atlassian.net)
