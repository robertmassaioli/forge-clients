---
editUrl: false
next: false
prev: false
title: "asApp"
---

> **asApp**(`adapter`): [`BoundClient`](/forge-clients/reference/interfaces/boundclient/)

Defined in: [packages/core/src/client/BoundClient.ts:49](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/client/BoundClient.ts#L49)

Make API calls as the Forge app itself.
This is the default and most common auth context for backend operations.

Use this for operations that the app performs autonomously — not on behalf
of a specific user.

## Parameters

### adapter

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/)

## Returns

[`BoundClient`](/forge-clients/reference/interfaces/boundclient/)

## Example

```typescript
import { asApp } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

const client = asApp(adapter);
const issue = await getIssue(client, { issueIdOrKey: 'PROJ-1' });
```
