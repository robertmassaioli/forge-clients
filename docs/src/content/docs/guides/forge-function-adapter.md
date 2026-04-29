---
title: ForgeFunctionAdapter
description: Using @forge-clients in Forge Functions (backend resolvers).
---

`ForgeFunctionAdapter` is the adapter for **Forge Functions** — the backend resolvers
that run inside Atlassian's Forge runtime. It wraps `@forge/api`'s `requestJira` and
`requestConfluence` utilities.

## Setup

```typescript
import { ForgeFunctionAdapter } from '@forge-clients/core';

// One adapter per product
const jiraAdapter = new ForgeFunctionAdapter({ product: 'jira' });
const confluenceAdapter = new ForgeFunctionAdapter({ product: 'confluence' });
```

## Full example

```typescript
// src/index.ts
import Resolver from '@forge/resolver';
import { ForgeFunctionAdapter } from '@forge-clients/core';
import { getIssue, addComment } from '@forge-clients/jira/v3';

const resolver = new Resolver();
const adapter = new ForgeFunctionAdapter({ product: 'jira' });

resolver.define('commentOnIssue', async (req) => {
  const { issueKey, comment } = req.payload;

  // Read as app, write as the user who triggered the action
  const issue = await getIssue(adapter, { type: 'asApp' }, {
    issueIdOrKey: issueKey,
    fields: ['summary'],
  });

  await addComment(adapter, { type: 'asUser' }, {
    issueIdOrKey: issueKey,
    body: {
      body: {
        type: 'doc', version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }],
      },
    },
  });

  return { success: true, issueSummary: issue.fields?.summary };
});

export const handler = resolver.getDefinitions();
```

## Notes

- `@forge/api` is a peer dependency — it must be installed in your Forge app
- The adapter dynamically imports `@forge/api` at runtime (it is not bundled)
- Both `asApp` and `asUser` auth contexts are supported
- Rate limiting is handled by the Forge runtime automatically
