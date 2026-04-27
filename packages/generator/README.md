# `@forge-clients/generator`

CLI and programmatic library for generating `@forge-clients/jira` and `@forge-clients/confluence`
from the cleaned Atlassian OpenAPI specifications in `@forge-clients/specs`.

## CLI Usage

```bash
# Install globally
npm install -g @forge-clients/generator

# Or use via npx
npx @forge-clients/generator generate

# Update specs from Atlassian and regenerate
npx @forge-clients/generator update-specs
npx @forge-clients/generator generate
```

## CLI Commands

### `generate`

Generates TypeScript client code from the cleaned OpenAPI specs.

```bash
forge-clients-gen generate [options]

Options:
  --spec <spec>   Which spec to generate: jira-v3, jira-v2, confluence-v2,
                  confluence-v1, jira-software, jira-sm, all (default: all)
  --out <dir>     Output directory (overrides defaults)
```

### `update-specs`

Downloads the latest Atlassian OpenAPI specs, applies the post-processing
pipeline, and writes cleaned specs to `@forge-clients/specs`.

```bash
forge-clients-gen update-specs [options]

Options:
  --dry-run       Show what would change without writing files
```

## Programmatic API

```typescript
import type { GeneratorOptions } from '@forge-clients/generator';

const options: GeneratorOptions = {
  specs: ['jira-v3', 'confluence-v2'],
  format: true,
  lint: true,
};

// Implementation pending
```

## Architecture

The generator consists of:

1. **Spec Pipeline** (`src/pipeline/`) — Downloads, validates, transforms, and patches the raw Atlassian specs
2. **Intermediate Representation** (`src/ir/`) — Converts the cleaned OpenAPI object into a normalised IR
3. **Emitters** (`src/emitters/`) — Converts the IR into TypeScript source files using `ts-morph`

See `ai-planning/` for the full design proposal.
