---
editUrl: false
next: false
prev: false
title: "ForgeRequestOptions"
---

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:44](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeAdapter.ts#L44)

Low-level options passed to [ForgeAdapter.fetch](/forge-clients/reference/interfaces/forgeadapter/#fetch).
Generated client functions construct this automatically — you rarely need
to interact with `ForgeRequestOptions` directly.

## Properties

### authContext

> **authContext**: [`AuthContext`](/forge-clients/reference/type-aliases/authcontext/)

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:56](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeAdapter.ts#L56)

Who is making the request

***

### body?

> `optional` **body?**: `unknown`

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:52](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeAdapter.ts#L52)

Request body — will be JSON-serialised

***

### headers?

> `optional` **headers?**: `Record`\<`string`, `string`\>

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:54](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeAdapter.ts#L54)

Additional HTTP headers to include

***

### method

> **method**: `"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"`

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:46](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeAdapter.ts#L46)

HTTP method for the request

***

### path

> **path**: `string`

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:48](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeAdapter.ts#L48)

Relative API path, e.g. `/rest/api/3/issue/PROJ-123`

***

### queryParams?

> `optional` **queryParams?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:50](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeAdapter.ts#L50)

Query string parameters — undefined values are omitted

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:58](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeAdapter.ts#L58)

Optional AbortSignal for cancellation
