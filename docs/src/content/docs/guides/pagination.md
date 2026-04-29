---
title: Pagination
description: Working with paginated Jira and Confluence API responses.
---

Many Jira and Confluence endpoints return paginated results. `@forge-clients/core`
provides helpers for working with these responses.

## Atlassian pagination models

Atlassian uses two pagination models:

**Offset-based** (Jira v3 search, Confluence content):
```json
{ "startAt": 0, "maxResults": 50, "total": 243, "values": [...] }
```

**Cursor-based** (Confluence v2, some Jira v3 endpoints):
```json
{ "results": [...], "_links": { "next": "/rest/api/v2/...?cursor=abc123" } }
```

## collectAllPages — collect everything into an array

Use when you need all results and the total is manageable (< ~1000 items):

```typescript
import { collectAllPages } from '@forge-clients/core';
import { getProjects } from '@forge-clients/jira/v3';

const allProjects = await collectAllPages(
  (startAt) => getProjects(adapter, { type: 'asApp' }, {
    startAt,
    maxResults: 50,
  }),
  (page) => page.values ?? [],
  (page) => page.total ?? 0,
);
// allProjects: ProjectBean[] — all projects, fetched across N pages
```

## iteratePages — process page by page

Use when you want to process results as they arrive, or stop early:

```typescript
import { iteratePages } from '@forge-clients/core';
import { searchForIssuesUsingJqlPost } from '@forge-clients/jira/v3';

for await (const page of iteratePages(
  (startAt) => searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
    body: { jql: 'project = PROJ', startAt, maxResults: 100 },
  }),
  (page) => page.issues ?? [],
  (page) => page.total ?? 0,
)) {
  for (const issue of page) {
    // Process each issue — stops fetching when you break out of the loop
    if (issue.fields?.status?.name === 'Done') break;
    await processIssue(issue);
  }
}
```

## iterateCursorPages — cursor-based pagination

For endpoints that use cursor-based pagination instead of offset:

```typescript
import { iterateCursorPages } from '@forge-clients/core';
import { getPages } from '@forge-clients/confluence/v1';

for await (const page of iterateCursorPages(
  (cursor) => getPages(adapter, { type: 'asApp' }, { cursor, limit: 25 }),
  (response) => response.results ?? [],
  (response) => response._links?.next ?? null,
)) {
  for (const confluencePage of page) {
    console.log(confluencePage.title);
  }
}
```
