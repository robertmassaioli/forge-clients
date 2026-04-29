---
title: Quick Start
description: Get from zero to a working Forge API call in 5 minutes.
---

This guide gets you from a blank Forge Function to a working, type-safe Jira API call in 5 minutes.

## Prerequisites

- A Forge app created with `forge create`
- Node.js 18+
- The Forge CLI installed and authenticated

## 1. Install the packages

In your Forge app directory:

```bash
npm install @forge-clients/jira @forge-clients/core
```

## 2. Create an adapter

The adapter tells the client how to make authenticated requests. In a Forge Function,
use `ForgeFunctionAdapter`:

```typescript
// src/index.ts
import { ForgeFunctionAdapter } from '@forge-clients/core';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });
```

## 3. Call an API function

```typescript
import Resolver from '@forge/resolver';
import { ForgeFunctionAdapter } from '@forge-clients/core';
import { getIssue, getCurrentUser } from '@forge-clients/jira/v3';

const resolver = new Resolver();
const adapter = new ForgeFunctionAdapter({ product: 'jira' });

resolver.define('getIssueDetails', async (req) => {
  const { issueKey } = req.payload;

  // Get the current user (asUser — uses the context user automatically)
  const user = await getCurrentUser(adapter, { type: 'asUser' }, {});

  // Get the issue (asApp — uses the app's credentials)
  const issue = await getIssue(adapter, { type: 'asApp' }, {
    issueIdOrKey: issueKey,
    fields: ['summary', 'status', 'assignee'],
  });

  return {
    user: user.displayName,
    issue: {
      key: issue.key,
      summary: issue.fields?.summary,
      status: issue.fields?.status?.name,
    },
  };
});

export const handler = resolver.getDefinitions();
```

## 4. Declare scopes in manifest.yml

```yaml
# manifest.yml
permissions:
  scopes:
    - read:jira-work
    - read:jira-user
```

## 5. Deploy and test

```bash
forge deploy
forge tunnel  # for local development
```

That's it! Your Forge Function is now calling the Jira REST API with full type safety.

## Next steps

- Learn about [auth contexts](/forge-clients/guides/auth-contexts/) (asApp vs asUser)
- See more [Jira examples](/forge-clients/jira/issues/)
- Understand the [adapter pattern](/forge-clients/getting-started/concepts/)
