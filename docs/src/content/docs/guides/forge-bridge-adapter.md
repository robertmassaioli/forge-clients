---
title: ForgeBridgeAdapter
description: Using @forge-clients in Custom UI (browser-side) Forge apps.
---

`ForgeBridgeAdapter` is the adapter for **Custom UI** — Forge apps that render their
own frontend in a sandboxed iframe. It uses the Forge bridge to proxy API calls
through the Forge runtime.

:::caution[Coming soon]
The `ForgeBridgeAdapter` implementation requires real-world testing in a Custom UI
app context. This guide will be updated once testing is complete. In the meantime,
use a Forge Function resolver as a proxy for your API calls.
:::

## Setup

```typescript
// In your Custom UI frontend code
import { ForgeBridgeAdapter } from '@forge-clients/core';

const adapter = new ForgeBridgeAdapter({ product: 'jira' });
```

## Usage

The bridge adapter works identically to the function adapter from the caller's
perspective — the same named functions, same auth contexts:

```typescript
import { getIssue } from '@forge-clients/jira/v3';

// In Custom UI, asUser is implicit — the bridge uses the current user's context
const issue = await getIssue(adapter, { type: 'asUser' }, {
  issueIdOrKey: 'PROJ-123',
});
```

## Important limitation

The `ForgeBridgeAdapter` only supports `asUser` (the implicit current user). It
cannot make `asApp` calls from the frontend — those must go through a Forge Function
resolver.
