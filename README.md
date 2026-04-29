# `@forge-clients` — TypeScript REST API Clients for Atlassian Forge

[![CI](https://github.com/robertmassaioli/forge-clients/actions/workflows/ci.yml/badge.svg)](https://github.com/robertmassaioli/forge-clients/actions/workflows/ci.yml)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://robertmassaioli.github.io/forge-clients/)

A monorepo containing a TypeScript-first OpenAPI client generator and generated REST API clients for [Atlassian Forge Apps](https://developer.atlassian.com/platform/forge/).

**📖 Full documentation:** [robertmassaioli.github.io/forge-clients](https://robertmassaioli.github.io/forge-clients/)

## Packages

| Package | Description | Version |
|---|---|---|
| [`@forge-clients/core`](./packages/core) | Shared adapters, error types, pagination helpers, retry logic | ![npm](https://img.shields.io/npm/v/@forge-clients/core) |
| [`@forge-clients/jira`](./packages/jira) | Jira Cloud REST API client (v2 + v3) | ![npm](https://img.shields.io/npm/v/@forge-clients/jira) |
| [`@forge-clients/confluence`](./packages/confluence) | Confluence Cloud REST API client (v1 + v2) | ![npm](https://img.shields.io/npm/v/@forge-clients/confluence) |
| [`@forge-clients/specs`](./packages/specs) | Cleaned & patched Atlassian OpenAPI specs | ![npm](https://img.shields.io/npm/v/@forge-clients/specs) |
| [`@forge-clients/generator`](./packages/generator) | CLI + library for generating the API clients | ![npm](https://img.shields.io/npm/v/@forge-clients/generator) |

## Supported Forge Execution Contexts

| Context | Package to import | Auth modes |
|---|---|---|
| **Forge Function** | `@forge-clients/core` → `ForgeFunctionAdapter` | `asApp`, `asUser` |
| **UI Kit 2** | `@forge-clients/core` → `ForgeBridgeAdapter` | `asUser` (implicit) |
| **Custom UI** | `@forge-clients/core` → `ForgeBridgeAdapter` | `asUser` (implicit) |
| **Forge Container** | `@forge-clients/core` → `ForgeContainerAdapter` | `asApp`, offline user impersonation |
| **Forge Remote** | `@forge-clients/core` → `ForgeRemoteAdapter` | `asApp`, `asUser`, offline user impersonation |

## Quick Start

```bash
# In a Forge Function
npm install @forge-clients/jira @forge-clients/core
```

```typescript
import { ForgeFunctionAdapter, asApp, asUser } from '@forge-clients/core';
import { getIssue, searchForIssuesUsingJql, createIssue } from '@forge-clients/jira';

// Create an adapter for your execution context
const adapter = new ForgeFunctionAdapter({ product: 'jira' });

// Bind to an auth context — asApp() or asUser()
const app  = asApp(adapter);   // make calls as the Forge app
const user = asUser(adapter);  // make calls as the invoking user

// Call named, fully-typed API functions
const issue = await getIssue(app, { path: { issueIdOrKey: 'PROJ-123' } });
console.log(issue.fields?.summary); // Fully typed! ✅

const results = await searchForIssuesUsingJql(user, { body: { jql: 'assignee = currentUser()' } });
console.log(results.issues?.length);
```

For more examples and all supported adapters, see the [full documentation](https://robertmassaioli.github.io/forge-clients/).

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Update OpenAPI specs from Atlassian
pnpm update-specs

# Regenerate clients from specs
pnpm generate

# Type-check all packages
pnpm typecheck
```

## Repository Structure

```
forge-clients/
├── packages/
│   ├── core/          # @forge-clients/core — runtime adapters & utilities
│   ├── generator/     # @forge-clients/generator — CLI + generation pipeline
│   ├── jira/          # @forge-clients/jira — generated Jira client
│   ├── confluence/    # @forge-clients/confluence — generated Confluence client
│   └── specs/         # @forge-clients/specs — cleaned OpenAPI specs
├── tsconfig.base.json # Shared TypeScript config
├── .eslintrc.json     # Shared ESLint config
├── .prettierrc.json   # Shared Prettier config
└── pnpm-workspace.yaml
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Licence

MIT
