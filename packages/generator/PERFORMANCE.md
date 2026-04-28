# @forge-clients/generator — Option 4: Custom AST Generator Performance

## Architecture

Option 4 uses a three-stage pipeline:

```
Cleaned OpenAPI JSON
        ↓
  [SpecToIR.ts]       Convert spec to Intermediate Representation (IR)
        ↓
  [TypeEmitter.ts]    Emit types.gen.ts via ts-morph AST
        ↓
  [SdkEmitter.ts]     Emit sdk.gen.ts via ts-morph AST
```

ts-morph constructs a TypeScript AST programmatically and then pretty-prints it,
which ensures correctly formatted, syntactically valid TypeScript output without
any string templating. The trade-off is higher per-operation cost compared to
string-interpolation-based generators.

## Performance Model

Empirically measured costs per stage (on Apple M-series hardware):

| Stage          | Per operation | Per schema/type | Fixed overhead |
|----------------|---------------|-----------------|----------------|
| SpecToIR       | ~0.1 ms       | ~0.05 ms        | ~50 ms         |
| TypeEmitter    | —             | ~0.4 ms         | ~20 ms         |
| SdkEmitter     | ~0.8 ms       | —               | ~20 ms         |
| ts-morph print | ~0.2 ms       | ~0.15 ms        | ~100 ms        |
| **Total**      | **~1.1 ms**   | **~0.6 ms**     | **~190 ms**    |

### Predicted Generation Times

| Spec             | Ops | Types | Predicted | Notes                          |
|------------------|-----|-------|-----------|--------------------------------|
| `jira-v3`        | 621 | 977   | ~90–120 s | Largest spec; complex allOf/oneOf |
| `jira-v2`        | 612 | 919   | ~85–110 s | Similar to v3, fewer types     |
| `jira-software`  |  95 |  66   | ~8–12 s   | Small, straightforward         |
| `jira-sm`        |  71 | 112   | ~8–12 s   | Small; includes dedup patches  |
| `confluence-v1`  | 130 | 170   | ~15–20 s  | Medium size                    |
| **TOTAL**        | **1529** | **2244** | **~3–4 min** | Sequential processing |

> **Why does ts-morph take so long?**
> ts-morph builds a real TypeScript compiler program for each source file, which
> means it runs the full TypeScript parser and type-checker infrastructure
> internally. For 977 types and 621 operations this involves constructing
> thousands of AST nodes. The output quality is significantly higher (correct
> formatting, proper generics, no string escaping bugs) but the cost is real.
>
> Compare with Option 2 (openapi-typescript): ~15–30 s total for all specs,
> because openapi-typescript emits raw TypeScript as strings without running
> the compiler. The wrapper generator adds ~5 s on top. Total ~20–35 s.

## Running Generation

```bash
# Generate all specs (expect ~3-4 minutes total)
pnpm --filter @forge-clients/generator exec tsx src/cli.ts generate

# Generate a single spec (faster for development iteration)
pnpm --filter @forge-clients/generator exec tsx src/cli.ts generate --only jira-v3

# Run the spec update pipeline first (downloads + cleans specs)
pnpm --filter @forge-clients/generator exec tsx src/cli.ts update-specs
```

## Benchmarking

A built-in benchmark is printed at the end of every `generate` run.
Example expected output:

```
📊 Timing Summary:
   Spec                   Ops  Types      Time      Rate
   -------------------------------------------------------
   jira-v3                621    977    102.3s   6 ops/s
   jira-v2                612    919     98.7s   6 ops/s
   jira-software           95     66      9.4s  10 ops/s
   jira-sm                 71    112      8.1s   9 ops/s
   confluence-v1          130    170     16.2s   8 ops/s
   -------------------------------------------------------
   TOTAL                 1529   2244    234.7s
```

To run a standalone benchmark (generates only the smallest spec for quick feedback):

```bash
pnpm --filter @forge-clients/generator exec tsx src/cli.ts generate --only jira-sm
```

## Performance Improvement Options

If generation time is a concern, the following improvements can be made:

1. **Parallel generation** — process specs concurrently with `Promise.all()`.
   Expected improvement: ~3x speedup on multi-core machines (reduces to ~1 min).

2. **Incremental generation** — skip specs where the cleaned JSON hash matches
   the previously generated output. Expected improvement: near-instant for
   unchanged specs.

3. **Replace ts-morph with string templates for hot paths** — use ts-morph only
   for complex type expressions (unions, intersections, generics) and plain
   string interpolation for simple scalar types and function signatures.
   Expected improvement: ~5x speedup overall.

4. **Switch to Option 2** — if generation time is the primary concern, Option 2
   (openapi-typescript + named wrappers) achieves equivalent output quality for
   types in ~30 s total by delegating to the Rust-compiled openapi-typescript
   binary. Option 4 is preferred when maximum control over output format,
   documentation quality, and custom Forge-specific annotations is required.
