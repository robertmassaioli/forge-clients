# `@forge-clients/jira`

Type-safe Jira Cloud REST API client for Atlassian Forge Apps.

Supports **Jira Cloud REST API v3** (default) and **v2** (legacy).

## Installation

```bash
npm install @forge-clients/jira @forge-clients/core
```

## Usage

### Forge Function (backend)

```typescript
import { ForgeFunctionAdapter } from '@forge-clients/core';
import { getIssue, createIssue, searchIssuesPaginated } from '@forge-clients/jira';

const client = new ForgeFunctionAdapter({ product: 'jira', context: 'asApp' });

// Fetch a single issue — fully typed response
const issue = await getIssue(client, { issueIdOrKey: 'PROJ-123' });
console.log(issue.fields.summary);

// Create an issue as the current user
const userClient = new ForgeFunctionAdapter({ product: 'jira', context: 'asUser' });
const newIssue = await createIssue(userClient, {
  body: {
    fields: {
      project: { key: 'PROJ' },
      summary: 'Created from Forge',
      issuetype: { name: 'Task' },
    },
  },
});

// Paginate through all issues matching a JQL query
for await (const issue of searchIssuesPaginated(client, {
  body: { jql: 'project = PROJ AND status = "In Progress"' },
})) {
  console.log(issue.key, issue.fields.summary);
}
```

### Forge Container / Remote

```typescript
import { ForgeContainerAdapter } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira';

const client = new ForgeContainerAdapter({
  product: 'jira',
  proxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
  installationId: 'your-installation-id',
});

const issue = await getIssue(client, { issueIdOrKey: 'PROJ-123' });
```

### UI Kit 2 / Custom UI (frontend)

```typescript
import { ForgeBridgeAdapter } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira';

// All bridge calls are automatically asUser (the logged-in user)
const client = new ForgeBridgeAdapter({ product: 'jira' });
const issue = await getIssue(client, { issueIdOrKey: 'PROJ-123' });
```

### Using the legacy v2 API

```typescript
import { getIssue } from '@forge-clients/jira/v2';
// or
import { JiraV2 } from '@forge-clients/jira';
const issue = await JiraV2.getIssue(client, { issueIdOrKey: 'PROJ-123' });
```

## Regenerating

The client files (`*.gen.ts`) are generated from the cleaned Atlassian OpenAPI spec.
To regenerate after a spec update:

```bash
pnpm --filter @forge-clients/jira run generate
```
