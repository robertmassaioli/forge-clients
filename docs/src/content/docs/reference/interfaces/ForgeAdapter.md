---
editUrl: false
next: false
prev: false
title: "ForgeAdapter"
---

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:72](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeAdapter.ts#L72)

The core transport interface implemented by every Forge execution context adapter.

Every Forge execution context (Forge Function, UI Kit 2, Custom UI,
Forge Container, Forge Remote) implements this interface, allowing
the generated clients to work identically regardless of context.

You do not implement this interface yourself — use one of the provided
adapters: [ForgeFunctionAdapter](/forge-clients/reference/classes/forgefunctionadapter/), [ForgeBridgeAdapter](/forge-clients/reference/classes/forgebridgeadapter/),
[ForgeContainerAdapter](/forge-clients/reference/classes/forgecontaineradapter/), or [ForgeRemoteAdapter](/forge-clients/reference/classes/forgeremoteadapter/).

## Properties

### product

> `readonly` **product**: `"jira"` \| `"confluence"`

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:74](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeAdapter.ts#L74)

The Atlassian product this adapter is configured to make requests to

## Methods

### fetch()

> **fetch**(`options`): `Promise`\<`Response`\>

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:80](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/adapters/ForgeAdapter.ts#L80)

Execute an HTTP request and return a standard `Response`.
Implementations are responsible for authentication header injection,
URL construction, and serialisation.

#### Parameters

##### options

[`ForgeRequestOptions`](/forge-clients/reference/interfaces/forgerequestoptions/)

#### Returns

`Promise`\<`Response`\>
