# `@forge-clients/specs`

Cleaned and patched Atlassian OpenAPI specifications for use by `@forge-clients/generator`.

## What's in here

- `src/cleaned/` — Post-processed OpenAPI specs ready for code generation (committed to git)
- `src/raw/` — Raw downloaded specs from developer.atlassian.com (git-ignored)
- `src/diffs/` — JSON diffs between raw and cleaned specs for review (git-ignored after initial review)

## Specs included

| File | Product | API Version | Source |
|---|---|---|---|
| `jira-v3.json` | Jira Cloud | v3 (current) | developer.atlassian.com/cloud/jira/platform/rest/v3 |
| `jira-v2.json` | Jira Cloud | v2 (legacy) | developer.atlassian.com/cloud/jira/platform/rest/v2 |
| `confluence-v2.json` | Confluence Cloud | v2 (current) | developer.atlassian.com/cloud/confluence/rest/v2 |
| `confluence-v1.json` | Confluence Cloud | v1 (deprecated) | developer.atlassian.com/cloud/confluence/rest/v1 |
| `jira-software.json` | Jira Software Cloud | v1 | developer.atlassian.com/cloud/jira/software/rest |
| `jira-sm.json` | Jira Service Management | v3 | developer.atlassian.com/cloud/jira/service-desk/rest |

## Updating specs

```bash
# From the monorepo root:
pnpm update-specs

# Or from this package:
pnpm update
```

This will:
1. Download the latest specs from Atlassian
2. Apply the post-processing pipeline (fixes known defects, adds Forge extensions)
3. Generate a diff for review
4. Write the cleaned specs to `src/cleaned/`

## Known fixes applied

See `ai-planning/02-openapi-spec-assessment.md` for a full catalogue of known
spec defects and how they are addressed by the post-processing pipeline.
