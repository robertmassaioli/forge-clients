---
title: Jira — Overview
description: Overview of the @forge-clients/jira package and its API modules.
---

The `@forge-clients/jira` package provides type-safe clients for all Jira Cloud REST APIs,
generated from Atlassian's official OpenAPI specifications.

## Available modules

| Module | Import path | Endpoints | Description |
|---|---|---|---|
| **Jira v3** | `@forge-clients/jira/v3` | 621 | Primary Jira Cloud REST API (recommended) |
| **Jira v2** | `@forge-clients/jira/v2` | 612 | Legacy Jira Cloud REST API |
| **Jira Software** | `@forge-clients/jira/software` | 95 | Boards, sprints, backlog (Jira Software only) |
| **Jira Service Management** | `@forge-clients/jira/service-management` | 71 | Requests, queues, customers (JSM only) |

## Which version to use?

**Use Jira v3** for new development. It supports Atlassian Document Format (ADF) for rich
text fields and is the actively developed version. Jira v2 is maintained for backwards
compatibility only.

```typescript
// ✅ Recommended — v3 is the default export
import { getIssue, createIssue } from '@forge-clients/jira';
import { getIssue, createIssue } from '@forge-clients/jira/v3'; // explicit

// ⚠️ Legacy — use only if you have a specific reason
import { getIssue } from '@forge-clients/jira/v2';

// Jira Software and Service Management are always explicit sub-path imports
import { getBoard, getSprint } from '@forge-clients/jira/software';
import { getQueue, getRequestTypes } from '@forge-clients/jira/service-management';
```

## Root import and namespaces

The root `@forge-clients/jira` import defaults to v3. It also re-exports v2, Software,
and Service Management as named namespaces for cases where you need multiple APIs:

```typescript
import {
  getIssue,    // v3 function (default)
  JiraV2,      // v2 namespace
  JiraSoftware, // Jira Software namespace
  JiraSM,      // Jira Service Management namespace
} from '@forge-clients/jira';

// Use v3 (default)
const issue = await getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });

// Use v2 via namespace
const legacyIssue = await JiraV2.getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });

// Use Jira Software via namespace
const board = await JiraSoftware.getBoard(client, { path: { boardId: 1 } });
```

:::tip[Prefer sub-path imports]
For production Forge apps, import from the explicit sub-path (`@forge-clients/jira/v3`)
rather than the root. This gives bundlers the best opportunity to tree-shake unused functions
from the other modules (v2, Software, Service Management).
:::

## Function naming

Function names match the `operationId` from the OpenAPI spec, converted to camelCase:

| REST endpoint | Function name |
|---|---|
| `GET /rest/api/3/issue/{issueIdOrKey}` | `getIssue` |
| `POST /rest/api/3/issue` | `createIssue` |
| `DELETE /rest/api/3/issue/{issueIdOrKey}` | `deleteIssue` |
| `POST /rest/api/3/issue/bulk` | `createIssues` |
| `GET /rest/api/3/myself` | `getCurrentUser` |
| `POST /rest/api/3/issue/picker` | `getIssuePickerResource` |

## Types

All types are available via the `Types` namespace re-exported from each module:

```typescript
import { ForgeFunctionAdapter, asApp } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';
import type { IssueBean } from '@forge-clients/jira/v3';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });
const issue: IssueBean = await getIssue(asApp(adapter), {
  path: { issueIdOrKey: 'PROJ-123' },
});
```
