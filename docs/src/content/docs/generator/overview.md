---
title: Generator — Overview
description: How the @forge-clients generator works and when to use it.
---

The `@forge-clients/generator` package is a CLI tool that:
1. Downloads Atlassian's official OpenAPI specs for Jira and Confluence
2. Applies a post-processing pipeline to fix known defects in those specs
3. Generates type-safe TypeScript client functions from the cleaned specs

You only need the generator if you are **maintaining** or **contributing to** `@forge-clients`.
If you are just *using* the clients in your Forge app, the generated output in
`@forge-clients/jira` and `@forge-clients/confluence` is all you need.

## CLI commands

### Update specs

Download fresh specs from Atlassian and apply the post-processing pipeline:

```bash
pnpm --filter @forge-clients/generator run update-specs
```

Options:
- `--force` — re-download even if cached specs are fresh
- `--dry-run` — show what would change without writing files

### Regenerate clients

Generate `types.gen.ts` and `sdk.gen.ts` from the cleaned specs:

```bash
pnpm --filter @forge-clients/generator run generate
```

## When to regenerate

- Atlassian releases a new API version
- A bug is found in a generated function signature
- A new patch or transform is added to fix a spec defect
- The IR or emitter logic is updated

## Architecture

```
Atlassian OpenAPI specs (downloaded)
        ↓
  Post-processing pipeline
  (transforms + JSON patches)
        ↓
  Cleaned specs (committed to git)
        ↓
  SpecToIR — converts spec to IR
        ↓
  TypeEmitter → types.gen.ts
  SdkEmitter  → sdk.gen.ts
        ↓
  @forge-clients/jira, @forge-clients/confluence
```

The IR (Intermediate Representation) is a product-agnostic model of the API that
decouples the spec parsing from the code generation. This makes it easy to add new
products or change the output format without touching the spec parsing logic.
