---
title: Updating Specs
description: How to download and refresh the Atlassian OpenAPI specs.
---

## Step 1: Download fresh specs

```bash
cd forge-clients
pnpm --filter @forge-clients/generator run update-specs
```

This downloads from:
- `https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json`
- `https://developer.atlassian.com/cloud/jira/platform/swagger.v2.json`
- `https://developer.atlassian.com/cloud/jira/software/swagger.v3.json`
- `https://developer.atlassian.com/cloud/jira/service-desk/swagger.v3.json`
- `https://developer.atlassian.com/cloud/confluence/swagger.v3.json`

Raw specs are saved to `packages/specs/src/raw/` (gitignored).
Cleaned specs are saved to `packages/specs/src/cleaned/` (committed to git).

## Step 2: Review the diff

```bash
# The pipeline generates a diff summary
cat packages/specs/src/diff/jira-v3.diff.json | jq '.summary'
```

## Step 3: Regenerate clients

```bash
pnpm --filter @forge-clients/generator run generate
```

## Step 4: Typecheck and test

```bash
pnpm -r run typecheck
pnpm run test
```

## Step 5: Commit

```bash
git add packages/specs/src/cleaned/ packages/jira/src/ packages/confluence/src/
git commit -m "chore: regenerate clients from updated Atlassian specs"
```
