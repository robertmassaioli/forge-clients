---
title: Post-Processing Pipeline
description: How @forge-clients fixes defects in Atlassian's OpenAPI specs.
---

Atlassian's OpenAPI specs have known defects that would produce incorrect or
unusable generated TypeScript. The post-processing pipeline fixes these before
code generation runs.

## Pipeline stages

### 1. Download

Fetches the raw spec from `developer.atlassian.com`. Results are cached locally
to avoid hitting Atlassian servers on every regeneration.

### 2. Parse & validate

Parses the JSON spec and validates it is well-formed OpenAPI 3.x.

### 3. Transforms (structural fixes)

Transforms are functions that take the full spec and return a modified spec.
Applied in order:

| Transform | What it fixes |
|---|---|
| `fixErrorResponses` | Adds missing `4xx`/`5xx` response schemas |
| `fixOneOfAnyOf` | Flattens broken `oneOf`/`anyOf` schemas |
| `fixNullableFields` | Adds `nullable: true` where responses can be null |
| `fixDeprecations` | Marks deprecated endpoints consistently |
| `fixCamelCase` | Renames snake_case and kebab-case property names |
| `sanitizeOperationIds` | Deduplicates and sanitizes `operationId` values |

### 4. Patches (targeted fixes)

Patches are precise JSON-patch operations targeting specific known defects:

```typescript
// Example patch: fix a specific wrong type in jira-v3
{ op: 'replace', path: '/components/schemas/IssueBean/properties/id/type', value: 'string' }
```

### 5. Write cleaned spec

The cleaned spec is written to `packages/specs/src/cleaned/` and committed to git.
This means the cleaned specs are versioned — you can see exactly what was changed
between spec versions.

### 6. Diff generation

A human-readable diff summary is generated in `packages/specs/src/diff/` showing
what the pipeline changed. Useful for reviewing spec updates.

## Adding a new fix

To fix a newly discovered spec defect:

1. **For a structural pattern** — add a new transform function in
   `packages/generator/src/pipeline/transforms/`
2. **For a one-off defect** — add a JSON patch entry in
   `packages/generator/src/pipeline/patches/<spec-id>.ts`
3. Run `pnpm run update-specs` and verify the fix in the diff output
4. Run `pnpm run generate` and verify the generated TypeScript is correct
