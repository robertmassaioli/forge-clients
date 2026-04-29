---
title: Installation
description: Installing @forge-clients packages in your Forge app.
---

## Requirements

- Node.js 18 or later
- A Forge app (created with `forge create`)
- npm, yarn, or pnpm

## Install in a Forge Function app

```bash
npm install @forge-clients/core @forge-clients/jira
# or
npm install @forge-clients/core @forge-clients/confluence
# or both
npm install @forge-clients/core @forge-clients/jira @forge-clients/confluence
```

## Install in a Custom UI app

Custom UI apps use the `ForgeBridgeAdapter`. Install in the `static/` directory:

```bash
cd static/my-app
npm install @forge-clients/core @forge-clients/jira
```

## Install in a Forge Container app

Containers can use the `ForgeContainerAdapter`:

```bash
npm install @forge-clients/core @forge-clients/jira @forge-clients/confluence
```

## TypeScript configuration

`@forge-clients` is published as ESM with TypeScript declarations. Your `tsconfig.json`
should target ES2020 or later:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true
  }
}
```

:::note[Forge bundler compatibility]
Forge's bundler uses webpack with `ts-loader`. Use `"module": "commonjs"` (not `"NodeNext"`)
in your Forge app's `tsconfig.json`. The `@forge-clients` packages handle this automatically —
the published `dist/` includes both CJS and ESM outputs.
:::

## Available packages

| Package | npm install | Use when |
|---|---|---|
| `@forge-clients/core` | Always required | Provides adapters, errors, retry, pagination |
| `@forge-clients/jira` | Jira API calls | Any Jira REST API operation |
| `@forge-clients/confluence` | Confluence API calls | Any Confluence REST API operation |
| `@forge-clients/generator` | Dev tool only | Regenerating clients from updated specs |

## Verifying the installation

```typescript
import { ForgeFunctionAdapter } from '@forge-clients/core';
import { getCurrentUser } from '@forge-clients/jira/v3';

// If this typechecks, installation is correct
const adapter = new ForgeFunctionAdapter({ product: 'jira' });
```
