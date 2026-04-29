---
title: Jira — Projects
description: Listing and managing Jira projects with @forge-clients.
---

## List all projects

```typescript
import { searchProjects } from '@forge-clients/jira/v3';

const result = await searchProjects(adapter, { type: 'asApp' }, {
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

const project = await getProject(adapter, { type: 'asApp' }, {
  projectIdOrKey: 'PROJ',
  expand: 'description,lead,issueTypes',
});

console.log(project.name);
console.log(project.lead?.displayName);
```

## Collect all projects (paginated)

```typescript
import { collectAllPages } from '@forge-clients/core';
import { searchProjects } from '@forge-clients/jira/v3';

const allProjects = await collectAllPages(
  (startAt) => searchProjects(adapter, { type: 'asApp' }, { startAt, maxResults: 50 }),
  (page) => page.values ?? [],
  (page) => page.total ?? 0,
);

console.log(`Total projects: ${allProjects.length}`);
```
