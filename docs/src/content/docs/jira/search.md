---
title: Jira — Search (JQL)
description: Searching Jira issues with JQL using @forge-clients.
---

```typescript
import { ForgeFunctionAdapter, asApp, asUser } from '@forge-clients/core';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });
```

## Basic JQL search

```typescript
import { searchForIssuesUsingJqlPost } from '@forge-clients/jira/v3';

const results = await searchForIssuesUsingJqlPost(asApp(adapter), {
  body: {
    jql: 'project = PROJ AND status != Done ORDER BY created DESC',
    maxResults: 100,
    fields: ['summary', 'status', 'assignee', 'priority', 'created'],
  },
});

console.log(`${results.total} issues found`);
```

## Paginate through all results

```typescript
import { iteratePages } from '@forge-clients/core';
import { searchForIssuesUsingJqlPost } from '@forge-clients/jira/v3';

const appClient = asApp(adapter);
let count = 0;

for await (const issue of iteratePages(
  (startAt) => searchForIssuesUsingJqlPost(appClient, {
    body: { jql: 'project = PROJ', startAt, maxResults: 100 },
  }),
  (r) => ({ items: r.issues ?? [], isLast: (r.startAt ?? 0) + (r.issues?.length ?? 0) >= (r.total ?? 0) }),
)) {
  count++;
  await processIssue(issue);
}
console.log(`Processed ${count} issues`);
```

## Common JQL patterns

```typescript
// Issues assigned to the current user (asUser)
const myIssues = await searchForIssuesUsingJqlPost(asUser(adapter), {
  body: { jql: 'assignee = currentUser() AND resolution = Unresolved' },
});

// Issues created in the last 7 days (asApp)
const recent = await searchForIssuesUsingJqlPost(asApp(adapter), {
  body: { jql: 'created >= -7d ORDER BY created DESC', maxResults: 50 },
});

// Issues with a specific label
const labelled = await searchForIssuesUsingJqlPost(asApp(adapter), {
  body: { jql: 'labels = "needs-review" AND status = "In Progress"' },
});
```
