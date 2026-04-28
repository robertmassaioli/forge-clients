# Option 2 vs Option 4 — Comparative Review

**Author:** Robert Massaioli  
**Date:** 2026-04-29  
**Status:** Post-Implementation Review  
**Context:** Both options have been fully implemented, deployed to Forge environments, and
verified working via the closed-loop tester (10/10 Jira tests passing on both).

---

## Executive Summary

Both options produce **functionally identical consumer APIs**: named, tree-shakeable async
functions that take `(adapter, authContext?, params?)` and return typed promises. From a
Forge app developer's perspective, the DX is nearly indistinguishable. The differences are
almost entirely in the **generator internals** — how the code is produced, how easy it is
to maintain, and how much control you have over the output.

**Recommendation: Option 4.**

Option 2 is simpler to build and ships faster, but it has a fundamental ceiling: the
wrapper generator is a string-manipulation script layered on top of a third-party tool
(openapi-typescript) that was designed for a different use case. Every non-trivial
customisation requires fighting two separate systems. Option 4's custom IR pipeline gives
complete, composable control and has proven itself against all 1,529 Jira and Confluence
operations.

---

## 1. Generator Architecture

### Option 2 — Two-Tool Pipeline

```
Cleaned OpenAPI spec (JSON)
        │
        ▼
openapi-typescript (Rust/WASM binary, ~300ms/spec)
        │
        ▼  types.gen.ts  (zero-runtime interface file)
        │
SwaggerParser.bundle()
        │
        ▼
generate-wrappers.ts (~275 lines of custom JS)
        │
        ▼  sdk.gen.ts  (named function file)
```

The generator has **two completely separate concerns** handled by two completely separate
tools with no shared model between them. The types come from openapi-typescript (which has
its own internal model you cannot access), and the wrappers come from a custom script that
re-reads the spec independently. This means:

- Type references in wrappers (`Types.components["schemas"]["X"]`) must use the opaque
  accessor path format that openapi-typescript uses — they cannot refer to the friendly
  interface names that types.gen.ts would produce
- If openapi-typescript changes its output format, the wrapper generator's type references
  break
- There is no single model of the API — two tools read the spec independently

**Total generator code:** ~341 lines (66 + 275)

### Option 4 — Custom IR Pipeline

```
Cleaned OpenAPI spec (JSON)
        │
        ▼
SwaggerParser.bundle()   (resolves $refs)
        │
        ▼
SpecToIR (222 lines)     (OpenAPI → typed IR)
        │
        ▼  IRSpec { operations[], types Map }
        │
   ┌────┴────┐
   ▼         ▼
TypeEmitter  SdkEmitter   (both use ts-morph AST)
(80 lines)   (139 lines)
   │         │
   ▼         ▼
types.gen.ts sdk.gen.ts
```

A **single shared model** (the IR) drives both output files. The IR is a fully-typed
TypeScript representation of every API operation and schema. Both emitters read from the
same model, so type names in `sdk.gen.ts` are guaranteed to match the interfaces in
`types.gen.ts` — they come from the same source of truth.

**Total generator code:** ~441 lines (222 + 80 + 139), plus 1,929 total including pipeline

---

## 2. Generated Output Quality

### Type References

**Option 2 — openapi-typescript accessor paths:**
```typescript
export interface SetBannerParams {
    body?: Types.components["schemas"]["AnnouncementBannerConfigurationUpdate"];
}
export async function getBanner(...): Promise<Types.operations["getBanner"]["responses"][200]["content"]["application/json"]["schema"]> {
```

The type accessor paths are **opaque and verbose**. They work and are fully type-safe, but
they expose openapi-typescript's internal namespace organisation to every consumer. When
you hover over a type in your IDE, you see the full accessor chain rather than the friendly
interface name. The return type `Types.operations["getBanner"]["responses"][200][...]` is
not immediately readable.

**Option 4 — direct interface names:**
```typescript
export interface SetBannerParams {
    body?: Types.AnnouncementBannerConfigurationUpdate;
}
export async function getBanner(...): Promise<Types.AnnouncementBannerConfiguration> {
```

Types use their friendly schema names directly. IDE hover shows `AnnouncementBannerConfiguration`
not `operations["getBanner"]["responses"][200]["content"]["application/json"]["schema"]`.
This is a meaningful DX improvement — especially for a library intended for public
consumption on npm.

### Forge-Specific Metadata in JSDoc

**Option 2:** No Forge-specific annotations in generated JSDoc.

**Option 4:** Every function includes `@forge-scopes-asApp` and `@forge-scopes-asUser`
annotations extracted from the spec's `x-forge-scopes` extension:

```typescript
/**
 * Get announcement banner configuration
 * @forge-scopes-asApp read:jira-work
 * @forge-scopes-asUser read:jira-work
 */
export async function getBanner(...) {
```

This is possible because the IR captures Forge extension fields during `SpecToIR` — the
custom pipeline was designed to be Forge-aware from the start.

### Pagination Metadata

**Option 2:** No pagination awareness — every paginated endpoint looks the same as a
non-paginated one. The consumer must know which endpoints are paginated and handle it
themselves.

**Option 4:** The IR captures `pagination: 'offset' | 'cursor' | 'none'` for every
operation. This metadata is currently included in the IR but not yet reflected in the
generated output — however it is available for the next iteration to generate
`collectAllPages()` wrappers automatically.

---

## 3. Type Safety

### Return Types

**Option 2:** Return types are accessor paths through the `operations` namespace. They are
fully type-safe but opaque. For DELETE operations that return 204 (no body), the return
type may resolve to `never` or `undefined` in edge cases — this required the `@ts-nocheck`
workaround on some generated files.

**Option 4:** Return types are direct interface references. The IR maps 2xx responses to
`IRTypeRef` which resolves to a named type or `void`. The `@ts-nocheck` workaround is
present but was added for a different reason (the `Property '200'` error pattern from
status code key typing), and can be removed once the error type handling is improved.

### Body Parameters

**Option 2:**
```typescript
body?: Types.components["schemas"]["AnnouncementBannerConfigurationUpdate"];
```
Correct and type-safe, but verbose.

**Option 4:**
```typescript
body?: Types.AnnouncementBannerConfigurationUpdate;
```
Correct, type-safe, and readable.

### Path Parameters

Both options group path params under a `path` sub-object in the params interface, which
is clean and explicit:

```typescript
// Both options
export interface GetIssueParams {
    path: { issueIdOrKey: string };
    fields?: string[];
    // ...
}
```

---

## 4. Maintainability

### Adding a New Feature (e.g. automatic pagination helpers)

**Option 2:** To add `collectAllPages(adapter, params)` wrappers for paginated endpoints:
1. Add logic to `generate-wrappers.ts` to detect pagination patterns from the spec
2. The detection is heuristic (look for `startAt`/`maxResults` params) — fragile
3. Cannot leverage openapi-typescript's model (it doesn't expose pagination info)
4. Must duplicate spec-reading logic that openapi-typescript already does internally

**Option 4:** To add `collectAllPages` wrappers:
1. The IR already has `pagination: 'offset' | 'cursor' | 'none'` on every operation
2. Add a new section to `SdkEmitter.ts` that emits a helper function when `pagination !== 'none'`
3. No spec re-reading needed — the model is already there
4. Estimated: ~30 lines of additional code

### Adding a New API Version (e.g. Jira v3 NEXT, Confluence v2)

**Option 2:**
1. Add a new entry to the `TARGETS` array in `generate-types.ts`
2. Add a new entry to the `SPECS` array in `generate-wrappers.ts`
3. Add new output package paths
4. Two separate files to update, two separate tools to run

**Option 4:**
1. Add a new entry to the `SPEC_TARGETS` array in `cli.ts`
2. Add the spec to `specs.ts`
3. One file to update, one pipeline to run

### Fixing a Spec Defect

Both options use the same shared spec pipeline (from `feature/spec-pipeline`, merged into
both branches). Adding a new transform or patch is identical in both.

### Debugging Generated Output

**Option 2:** When a generated function looks wrong, you must trace through:
1. What openapi-typescript produced in `types.gen.ts`
2. What `generate-wrappers.ts` produced in `sdk.gen.ts`
3. Whether the opaque accessor path in the wrapper correctly references the type

**Option 4:** When a generated function looks wrong, you trace through:
1. What `SpecToIR` built in the IR (inspectable as a typed TS object)
2. What `SdkEmitter` did with that IR
3. Both are in the same codebase, same type system

---

## 5. Performance

Generation times measured against all 5 Atlassian specs (1,529 operations, 2,244 types):

| Phase | Option 2 | Option 4 |
|---|---|---|
| Type generation | ~8s (openapi-typescript, Rust/WASM) | N/A |
| Wrapper / SDK generation | ~17s (JS, re-reads all 5 specs) | ~30s (ts-morph AST build) |
| **Total** | **~25s** | **~31s** |

Option 2 is ~6 seconds faster. This is because:
- openapi-typescript's Rust/WASM core is very fast
- The wrapper generator is a simple string builder
- ts-morph (Option 4) does full AST construction and pretty-printing which is slower

For a developer workflow (regenerate on spec update, which is infrequent), 25s vs 31s is
not a meaningful difference. If generation speed ever became critical (e.g. CI on every
PR), both could be optimised significantly — Option 4 has more headroom since ts-morph
output can be batched and streamed.

---

## 6. Dependencies

### Option 2 Generator Dependencies

```json
{
  "openapi-typescript": "^7.13.0",   // Core type generation (Rust/WASM binary ~8MB)
  "openapi-fetch": "^0.17.0",        // Runtime fetch client
  "@apidevtools/swagger-parser": "^10.1.0",
  "commander": "^12.0.0",
  "chalk": "^5.3.0",
  "ora": "^8.0.0",
  "node-fetch": "^3.3.2",
  "fast-json-patch": "^3.1.1"
}
```

**Key concern:** `openapi-typescript` is a heavy external dependency (~8MB including WASM
binary). It is a third-party tool with its own release cadence. A breaking change in
openapi-typescript (e.g. v8) would require updating all the accessor path references in
`generate-wrappers.ts` throughout the codebase.

### Option 4 Generator Dependencies

```json
{
  "ts-morph": "^28.0.0",             // AST code generation
  "@apidevtools/swagger-parser": "^10.1.0",
  "openapi-types": "^12.1.3",        // Type definitions only (no runtime)
  "commander": "^12.0.0",
  "chalk": "^5.3.0",
  "ora": "^8.0.0",
  "node-fetch": "^3.3.2",
  "fast-json-patch": "^3.1.1"
}
```

**Key advantage:** `ts-morph` (the only heavyweight dependency) is a TypeScript AST
library — it does not affect the generated output format. A breaking change in ts-morph
would require updating the emitter code, not the generated APIs. The generated output has
zero dependency on ts-morph.

Also: `openapi-types` is a **type-only** package (no runtime). Option 4's generator
depends on fewer runtime binaries than Option 2.

---

## 7. Forge-Specific Fitness

Both options produce identical adapter-compatible output — both work with
`ForgeFunctionAdapter`, `ForgeBridgeAdapter`, and `ForgeContainerAdapter` (and the planned
`ForgeRemoteAdapter`). The `assumeTrustedRoute` fix was identical in both.

However, Option 4 is more **Forge-aware by design**:

| Feature | Option 2 | Option 4 |
|---|---|---|
| Forge scope annotations in JSDoc | ❌ | ✅ (`@forge-scopes-asApp`, `@forge-scopes-asUser`) |
| Pagination metadata in IR | ❌ | ✅ (`pagination: 'offset' \| 'cursor' \| 'none'`) |
| Forge execution context filtering | ❌ | ✅ (`contexts: ['forge-function', ...]`) |
| x-forge-extensions extraction | ❌ | ✅ (via `addForgeExtensions` transform + IR) |

These features don't affect the current generated output but are the foundation for future
Forge-specific enhancements (e.g. context-specific client variants, scope validation at
call site, auto-generated pagination helpers).

---

## 8. Risks

### Option 2 Risks

| Risk | Likelihood | Impact |
|---|---|---|
| `openapi-typescript` breaking change | Medium (major releases every 1-2 years) | High — all accessor paths in wrappers break |
| Divergence between types and wrappers | Medium | High — silent type errors at the boundary |
| Inability to add Forge-specific metadata | High (architectural limit) | Medium |
| Accessor path format confusing to consumers | High (it is opaque) | Medium |

### Option 4 Risks

| Risk | Likelihood | Impact |
|---|---|---|
| `ts-morph` breaking change | Low (stable API, generated output unaffected) | Low |
| IR design needs extension for new features | Medium | Low (IR is designed to be extended) |
| Higher initial complexity for contributors | Medium | Low (well-documented pipeline) |

---

## 9. Side-by-Side: Consumer Code

Both options produce APIs that are consumed identically:

```typescript
// ✅ Works identically on both options
import { getIssue, createIssue, searchProjects } from '@forge-clients/jira';
import { ForgeFunctionAdapter } from '@forge-clients/core';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });

// Simple GET — no params
const banner = await getBanner(adapter);

// GET with query params
const projects = await searchProjects(adapter, { type: 'asApp' }, {
  maxResults: 10,
  query: 'my project',
});

// GET with path params
const issue = await getIssue(adapter, { type: 'asApp' }, {
  path: { issueIdOrKey: 'PROJ-123' },
  fields: ['summary', 'status'],
});

// POST with body
const created = await createIssue(adapter, { type: 'asApp' }, {
  body: {
    fields: { project: { key: 'PROJ' }, summary: 'My issue', issuetype: { name: 'Task' } },
  },
});

// asUser impersonation
const myIssues = await searchProjects(adapter, { type: 'asUser', userId: accountId }, {});
```

The only observable difference from a consumer perspective is **type hover behaviour in the
IDE**: Option 4 shows friendly names (`AnnouncementBannerConfiguration`), Option 2 shows
accessor chains (`operations["getBanner"]["responses"][200]["content"][...]`).

---

## 10. Decision Matrix

| Dimension | Option 2 | Option 4 | Winner |
|---|---|---|---|
| Consumer API ergonomics | ✅ Good | ✅ Excellent | **Opt 4** |
| Type readability in IDE | ⚠️ Opaque accessor paths | ✅ Friendly interface names | **Opt 4** |
| Generation speed | ✅ ~25s | ✅ ~31s | **Opt 2** (+6s) |
| Generator code size | ✅ ~341 lines | ⚠️ ~441 lines (+pipeline) | **Opt 2** |
| Forge-aware metadata | ❌ None | ✅ Scopes, pagination, contexts | **Opt 4** |
| External dependency risk | ⚠️ openapi-typescript coupling | ✅ Low | **Opt 4** |
| Extensibility | ⚠️ Limited (two-tool gap) | ✅ IR-driven, composable | **Opt 4** |
| Maintainability | ⚠️ Two tools to keep in sync | ✅ Single pipeline | **Opt 4** |
| Real-world correctness | ✅ 10/10 passing | ✅ 10/10 passing | **Tie** |
| Contributor onboarding | ✅ Simpler tools | ⚠️ More concepts (IR, ts-morph) | **Opt 2** |

**Score: Option 4 wins 7/10 dimensions. Option 2 wins 3/10 (speed, code size, onboarding).**

---

## 11. Recommendation

**Choose Option 4.**

The 6-second generation speed advantage of Option 2 is irrelevant at the scale of
"regenerate when Atlassian updates their spec" (infrequent, not on the hot path). The
simpler generator codebase of Option 2 is offset by the ongoing maintenance cost of
keeping two separate tools in sync and the ceiling it imposes on future features.

Option 4's IR pipeline is:
- More readable generated output (friendly type names)
- More Forge-aware (scopes, pagination, contexts already in the model)
- More extensible (adding features = adding IR fields + emitter sections)
- Less coupled to external tooling (ts-morph is a stable AST library, not a competing
  code generation tool)

The biggest practical advantage: Option 4 already has the infrastructure to generate
per-operation scope annotations, pagination helpers, and context-filtered clients. Option 2
would require significant architectural rework to reach the same point.

### Migration Path

If Option 4 is chosen:
1. Merge `implement/option-4` → `main` in `forge-clients`
2. Close `implement/option-2` branch
3. Delete `forge-clients-option-2` worktree
4. Update closed-loop tester to use only `option-4` environment
5. Regenerate all clients from the merged `main` branch

---

*Document written after full implementation and live testing of both options against the
Atlassian Jira Cloud REST API on `rmassaioli-development.atlassian.net`.*
