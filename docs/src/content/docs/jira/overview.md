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
// ✅ Recommended
import { getIssue, createIssue } from '@forge-clients/jira/v3';

// ⚠️ Legacy — use only if you have a specific reason
import { getIssue } from '@forge-clients/jira/v2';
```

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
import { getIssue } from '@forge-clients/jira/v3';
import type { Types } from '@forge-clients/jira/v3';

const issue: Types.IssueBean = await getIssue(adapter, { type: 'asApp' }, {
  issueIdOrKey: 'PROJ-123',
});
```
