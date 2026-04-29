---
title: Jira — Issues
description: Creating, reading, updating, and deleting Jira issues with @forge-clients.
---

import { ForgeFunctionAdapter, asApp, asUser } from '@forge-clients/core';
import { getIssue, createIssue, editIssue, deleteIssue, addComment, getTransitions, doTransition, searchForIssuesUsingJqlPost } from '@forge-clients/jira/v3';

```typescript
import { ForgeFunctionAdapter, asApp, asUser } from '@forge-clients/core';
```

## Get an issue

Path parameters are nested under `path:` in the params object.

```typescript
import { getIssue } from '@forge-clients/jira/v3';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });

const issue = await getIssue(asApp(adapter), {
  path: { issueIdOrKey: 'PROJ-123' },
  // Request specific fields to reduce response size
  fields: ['summary', 'status', 'assignee', 'priority'],
});

console.log(issue.fields?.summary);                  // 'Fix login bug'
console.log(issue.fields?.status?.name);             // 'In Progress'
console.log(issue.fields?.assignee?.displayName);    // 'Jane Smith'
```

## Create an issue

```typescript
import { createIssue } from '@forge-clients/jira/v3';

const created = await createIssue(asApp(adapter), {
  body: {
    fields: {
      project: { key: 'PROJ' },
      issuetype: { name: 'Bug' },
      summary: 'Login fails on Safari',
      priority: { name: 'High' },
      description: {
        // ADF (Atlassian Document Format) for rich text
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: 'Reproducible on Safari 17+ on macOS.' }],
        }],
      },
    },
  },
});

console.log(created.key);  // 'PROJ-124'
```

## Update an issue

```typescript
import { editIssue } from '@forge-clients/jira/v3';

await editIssue(asApp(adapter), {
  path: { issueIdOrKey: 'PROJ-123' },
  body: {
    fields: {
      summary: 'Login fails on Safari 17+',
      priority: { name: 'Critical' },
    },
  },
});
```

## Delete an issue

```typescript
import { deleteIssue } from '@forge-clients/jira/v3';

await deleteIssue(asApp(adapter), {
  path: { issueIdOrKey: 'PROJ-123' },
  deleteSubtasks: 'true',
});
```

## Search with JQL

```typescript
import { searchForIssuesUsingJqlPost } from '@forge-clients/jira/v3';

const results = await searchForIssuesUsingJqlPost(asApp(adapter), {
  body: {
    jql: 'project = PROJ AND status = "In Progress" ORDER BY priority DESC',
    maxResults: 50,
    fields: ['summary', 'status', 'assignee', 'priority'],
  },
});

console.log(`Found ${results.total} issues`);
for (const issue of results.issues ?? []) {
  console.log(`${issue.key}: ${issue.fields?.summary}`);
}
```

## Add a comment

Comments should typically be added as the user, not as the app:

```typescript
import { addComment } from '@forge-clients/jira/v3';

await addComment(asUser(adapter), {
  path: { issueIdOrKey: 'PROJ-123' },
  body: {
    body: {
      type: 'doc',
      version: 1,
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: 'Fixed in commit abc123.' }],
      }],
    },
  },
});
```

## Transition an issue

```typescript
import { doTransition, getTransitions } from '@forge-clients/jira/v3';

// First get available transitions
const { transitions } = await getTransitions(asApp(adapter), {
  path: { issueIdOrKey: 'PROJ-123' },
});

const doneTransition = transitions?.find(t => t.name === 'Done');

if (doneTransition?.id) {
  await doTransition(asUser(adapter), {
    path: { issueIdOrKey: 'PROJ-123' },
    body: { transition: { id: doneTransition.id } },
  });
}
```
