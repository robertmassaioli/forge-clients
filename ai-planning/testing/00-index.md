# @forge-clients Testing Strategy

**Author:** Robert Massaioli  
**Date:** 2026-04-29  
**Status:** Proposed  

This directory contains the complete testing strategy for the `@forge-clients` monorepo.

---

## Core Constraint

> **All tests must run without a Forge runtime, without network access, and without installing a Forge app.**

The `@forge/api` and `@forge/bridge` packages only function inside the Forge runtime.
`ForgeContainerAdapter` requires `FORGE_EGRESS_PROXY_URL`. The generators read spec files
from disk. Every one of these dependencies must be mocked or stubbed in tests.

---

## Documents in This Directory

| File | Contents |
|---|---|
| `00-index.md` | This file — overview, philosophy, tooling |
| `01-mock-adapter.md` | The `MockForgeAdapter` pattern — key tool for testing generated functions |
| `02-core-adapters.md` | Testing `ForgeFunctionAdapter`, `ForgeBridgeAdapter`, `ForgeContainerAdapter` |
| `03-core-utilities.md` | Testing `OfflineTokenManager`, errors, retry handler, pagination helpers |
| `04-generated-functions.md` | Testing the generated Jira and Confluence client functions |
| `05-generator.md` | Testing `SpecToIR`, `TypeEmitter`, `SdkEmitter`, transforms, patches |
| `06-infrastructure.md` | `vitest.config.ts`, coverage targets, CI, implementation plan |

---

## Testing Philosophy

### 1. Mock at the Boundary

Every external dependency has exactly one mock point:

| Dependency | Mock Strategy |
|---|---|
| `@forge/api` | `vi.mock('@forge/api', ...)` — replaces the dynamic import |
| `@forge/bridge` | `vi.mock('@forge/bridge', ...)` — replaces the dynamic import |
| Global `fetch` | `vi.fn()` assigned to `global.fetch` |
| `FORGE_EGRESS_PROXY_URL` | `process.env.FORGE_EGRESS_PROXY_URL = 'https://mock.proxy'` |
| File system (specs) | Use real spec files in `packages/specs/src/cleaned/` — they are static |
| `ForgeAdapter` (for generated fns) | `MockForgeAdapter` — see `01-mock-adapter.md` |

### 2. Dependency Injection Makes Testing Easy

The most important design decision in `@forge-clients` for testability is that every
generated function receives its adapter as a parameter:

```typescript
// This is trivially testable — just pass a MockForgeAdapter
export async function getIssue(
  adapter: ForgeAdapter,         // ← injected
  authContext: AuthContext,
  params: GetIssueParams,
): Promise<Types.IssueBean>
```

Compare this to a design where the adapter is a singleton or global — that would require
much more invasive mocking. The current design means generated function tests need zero
mocking of Forge internals.

### 3. No Integration Tests in This Suite

The closed-loop tester (`Forge-Rest-Development-Closed-Loop-Tester`) already serves as
the integration test harness — it deploys to a real Forge environment and runs real API
calls. The unit tests in this suite are deliberately complementary:

| Concern | Where tested |
|---|---|
| Correct URL paths, query params, body shape | Unit tests (this suite) |
| Correct Forge authentication | Unit tests (mock @forge/api) |
| Real API responses, rate limits, error formats | Closed-loop tester |
| Forge runtime compatibility | Closed-loop tester |

### 4. Test What You Own

The generated `.gen.ts` files are outputs of the generator, not source code. They should
be excluded from coverage requirements. Instead, test:
- The generator that produces them (input spec → expected output)
- The functions inside them (via `MockForgeAdapter`)

---

## Tooling

### Vitest

Already installed (`vitest@2.0.0` in devDependencies). No additional framework needed.

**Why Vitest over Jest:**
- Native ESM support (our packages use `"type": "module"`)
- Faster than Jest for TypeScript projects
- `vi.mock()` API is identical to `jest.mock()` — low learning curve
- First-class `vi.useFakeTimers()` for testing time-dependent code (token refresh)
- Workspace support for running tests across all monorepo packages

### Vitest Workspace Mode

Rather than running `vitest` separately in each package, configure a root-level
workspace that discovers all packages. See `06-infrastructure.md` for the full config.

### fetch Mocking

Two approaches depending on the test:

**1. Direct `global.fetch` assignment (simple cases):**
```typescript
global.fetch = vi.fn().mockResolvedValue(
  new Response('{"id":"123"}', { status: 200 })
);
```

**2. `@mswjs/msw` (complex request matching):**
For `ForgeContainerAdapter` and `OfflineTokenManager` where you need to assert on
specific URL patterns, headers, and request bodies, MSW (Mock Service Worker) in
Node mode provides a cleaner API:
```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('https://proxy.example.com/graphql', () =>
    HttpResponse.json({ data: { offlineUserAuthToken: { accessToken: 'tok', expiry: 9999 } } })
  )
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

MSW is the recommended approach for any test that needs to assert on what URL was called
or what request headers were sent, because it intercepts at the network level without
needing to assert on raw `vi.fn()` call arguments.

---

## Test File Naming Convention

```
packages/
  core/
    src/
      adapters/
        ForgeFunctionAdapter.ts
        ForgeFunctionAdapter.test.ts    ← co-located with source
      auth/
        OfflineTokenManager.ts
        OfflineTokenManager.test.ts
  jira/
    src/
      __tests__/
        getIssue.test.ts                ← for generated functions, use __tests__/
        createIssue.test.ts
  generator/
    src/
      ir/
        SpecToIR.ts
        SpecToIR.test.ts
```

Co-locate test files with source files for `packages/core` and `packages/generator`.
Use a `__tests__/` directory for generated function tests in `packages/jira` and
`packages/confluence` to avoid cluttering the generated output directory.

---

## Running Tests

```bash
# Run all tests across all packages
pnpm -r run test

# Run tests in a specific package
pnpm --filter @forge-clients/core run test

# Run in watch mode during development
pnpm --filter @forge-clients/core run test:watch

# Run with coverage
pnpm -r run test:coverage

# Run a specific test file
pnpm --filter @forge-clients/core exec vitest run src/adapters/ForgeFunctionAdapter.test.ts
```
