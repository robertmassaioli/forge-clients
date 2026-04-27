# `@forge-clients/confluence`

Type-safe Confluence Cloud REST API client for Atlassian Forge Apps.

Supports **Confluence Cloud REST API v2** (default) and **v1** (deprecated, for backwards compatibility).

## Installation

```bash
npm install @forge-clients/confluence @forge-clients/core
```

## Usage

### Forge Function (backend)

```typescript
import { ForgeFunctionAdapter } from '@forge-clients/core';
import { getPageById, createPage } from '@forge-clients/confluence';

const client = new ForgeFunctionAdapter({ product: 'confluence', context: 'asApp' });

// Fetch a page — fully typed response
const page = await getPageById(client, { id: '123456789' });
console.log(page.title);

// Create a page as the current user
const userClient = new ForgeFunctionAdapter({ product: 'confluence', context: 'asUser' });
const newPage = await createPage(userClient, {
  body: {
    spaceId: 'SPACE_ID',
    title: 'My New Page',
    parentId: '123456789',
    body: {
      representation: 'storage',
      value: '<p>Hello from Forge!</p>',
    },
  },
});
```

### Forge Container / Remote

```typescript
import { ForgeContainerAdapter } from '@forge-clients/core';
import { getPageById } from '@forge-clients/confluence';

const client = new ForgeContainerAdapter({
  product: 'confluence',
  proxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
  installationId: 'your-installation-id',
});

const page = await getPageById(client, { id: '123456789' });
```

### Using the legacy v1 API

```typescript
import { getContent } from '@forge-clients/confluence/v1';
// or
import { ConfluenceV1 } from '@forge-clients/confluence';
const content = await ConfluenceV1.getContent(client, { id: '123456789' });
```

## Regenerating

```bash
pnpm --filter @forge-clients/confluence run generate
```
