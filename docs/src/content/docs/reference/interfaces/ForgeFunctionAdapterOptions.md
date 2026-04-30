---
editUrl: false
next: false
prev: false
title: "ForgeFunctionAdapterOptions"
---

Defined in: [packages/core/src/adapters/ForgeFunctionAdapter.ts:21](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeFunctionAdapter.ts#L21)

Options for constructing a [ForgeFunctionAdapter](/forge-clients/reference/classes/forgefunctionadapter/).

## Properties

### defaultContext?

> `optional` **defaultContext?**: `"asApp"` \| `"asUser"`

Defined in: [packages/core/src/adapters/ForgeFunctionAdapter.ts:28](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeFunctionAdapter.ts#L28)

Default auth context used when the request does not explicitly specify one.

#### Default Value

`'asApp'`

***

### product

> **product**: `"jira"` \| `"confluence"`

Defined in: [packages/core/src/adapters/ForgeFunctionAdapter.ts:23](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/adapters/ForgeFunctionAdapter.ts#L23)

The Atlassian product to make requests to
