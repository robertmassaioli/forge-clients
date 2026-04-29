---
title: Jira — Search (JQL)
description: Searching Jira issues with JQL using @forge-clients.
---

## Basic JQL search

```typescript
import { searchForIssuesUsingJqlPost } from '@forge-clients/jira/v3';

const results = await searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
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

let count = 0;
for await (const page of iteratePages(
  (startAt) => searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
    body: { jql: 'project = PROJ', startAt, maxResults: 100 },
  }),
  (r) => r.issues ?? [],
  (r) => r.total ?? 0,
)) {
  count += page.length;
  for (const issue of page) {
    await processIssue(issue);
  }
}
console.log(`Processed ${count} issues`);
```

## Common JQL patterns

```typescript
// Issues assigned to the current app user
const myIssues = await searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
  body: { jql: 'assignee = currentUser() AND resolution = Unresolved' },
});

// Issues created in the last 7 days
const recent = await searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
  body: { jql: 'created >= -7d ORDER BY created DESC', maxResults: 50 },
});

// Issues with a specific label
const labelled = await searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
  body: { jql: 'labels = "needs-review" AND status = "In Progress"' },
});
```
