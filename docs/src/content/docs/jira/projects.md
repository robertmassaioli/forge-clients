---
title: Jira — Projects
description: Listing and managing Jira projects with @forge-clients.
---

```typescript
import { ForgeFunctionAdapter, asApp } from '@forge-clients/core';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });
```

## List all projects

```typescript
import { searchProjects } from '@forge-clients/jira/v3';

const result = await searchProjects(asApp(adapter), {
  maxResults: 50,
  orderBy: 'name',
  expand: 'description,lead',
});

for (const project of result.values ?? []) {
  console.log(`${project.key}: ${project.name}`);
}
```

## Get a single project

```typescript
import { getProject } from '@forge-clients/jira/v3';

const project = await getProject(asApp(adapter), {
  path: { projectIdOrKey: 'PROJ' },
  expand: 'description,lead,issueTypes',
});

console.log(project.name);
console.log(project.lead?.displayName);
```

## Collect all projects (paginated)

```typescript
import { collectAllPages } from '@forge-clients/core';
import { searchProjects } from '@forge-clients/jira/v3';

const appClient = asApp(adapter);

// collectAllPages(fetchPage, pageSize?)
// fetchPage receives (startAt, maxResults) — pass both to the API call
const allProjects = await collectAllPages(
  (startAt, maxResults) => searchProjects(appClient, { startAt, maxResults }),
  50, // pageSize — default is 50 if omitted
);

console.log(`Total projects: ${allProjects.length}`);
```
