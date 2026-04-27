# Contributing to `@forge-clients`

## Prerequisites

- Node.js >= 18
- pnpm >= 9 (`npm install -g pnpm`)

## Setup

```bash
git clone <repo>
cd forge-clients
pnpm install
pnpm build
```

## Workflow

### Making changes to a package

1. Edit source files in `packages/<package>/src/`
2. Run `pnpm --filter @forge-clients/<package> run build` to build
3. Run `pnpm --filter @forge-clients/<package> run test` to test
4. Run `pnpm typecheck` to check types across all packages

### Adding a changeset (required for releases)

```bash
pnpm changeset
# Follow the prompts to describe your change
```

### Updating OpenAPI specs

```bash
pnpm update-specs
# Review the diff in packages/specs/src/diffs/
# Commit the updated specs
pnpm generate
# Review the generated client changes
```

## Package Dependency Order

Build packages in this order (dependency graph):

```
specs → core → generator → jira, confluence
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `chore:` Build/tooling changes
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `test:` Adding or updating tests
- `spec:` OpenAPI spec updates
