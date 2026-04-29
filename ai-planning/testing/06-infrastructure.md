# Testing Infrastructure

`vitest.config.ts`, coverage configuration, CI integration, and implementation plan.

---

## 6.1 Root-Level vitest.config.ts

Place this at `forge-clients/vitest.config.ts` to run all tests across the monorepo
in a single vitest workspace invocation:

```typescript
// forge-clients/vitest.config.ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    // @forge-clients/core — adapters, auth, errors, retry, pagination
    test: {
      name: 'core',
      include: ['packages/core/src/**/*.test.ts'],
      environment: 'node',
      globals: true,
    },
  },
  {
    // @forge-clients/generator — SpecToIR, emitters, transforms, patches
    test: {
      name: 'generator',
      include: [
        'packages/generator/src/**/*.test.ts',
        'packages/specs/src/**/*.test.ts',
      ],
      environment: 'node',
      globals: true,
    },
  },
  {
    // @forge-clients/jira — generated function tests
    test: {
      name: 'jira',
      include: ['packages/jira/src/__tests__/**/*.test.ts'],
      environment: 'node',
      globals: true,
    },
  },
  {
    // @forge-clients/confluence — generated function tests
    test: {
      name: 'confluence',
      include: ['packages/confluence/src/__tests__/**/*.test.ts'],
      environment: 'node',
      globals: true,
    },
  },
]);
```

### Root package.json scripts

Add to `forge-clients/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 6.2 Per-Package vitest.config.ts

Each package also needs its own config so `pnpm --filter @forge-clients/core run test` works:

```typescript
// packages/core/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test-utils/**'],
    },
  },
});
```

```typescript
// packages/generator/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    testTimeout: 30_000, // Generator tests involving ts-morph may be slower
  },
});
```

```typescript
// packages/jira/vitest.config.ts (and confluence/vitest.config.ts)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    // Generated .gen.ts files are explicitly excluded from coverage
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.gen.ts', 'src/**/*.test.ts'],
    },
  },
});
```

---

## 6.3 Per-Package package.json Updates

Each package needs consistent test scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0"
  }
}
```

The `@forge-clients/jira` and `@forge-clients/confluence` packages also need
`@forge-clients/core` in their devDependencies (already there as a workspace dep)
and the `MockForgeAdapter` export from `@forge-clients/core/test-utils`.

---

## 6.4 Coverage Targets

### What to cover

| Package | Target | Rationale |
|---|---|---|
| `@forge-clients/core` | **90%** statements | This is pure logic — adapters, errors, retry, pagination. High coverage is achievable. |
| `@forge-clients/generator` | **80%** statements | The generator is complex with many branches; some spec edge cases are hard to test synthetically. |
| `@forge-clients/jira` / `@forge-clients/confluence` | **Pattern coverage only** | 100% function coverage is impractical at 1,500+ functions. Test one per pattern (see `04-generated-functions.md`). |
| `@forge-clients/specs` | **95%** for transforms and patches | These are pure functions — straightforward to test exhaustively. |

### What to explicitly exclude from coverage

```typescript
// In vitest.config.ts coverage.exclude arrays:
[
  'src/**/*.gen.ts',           // Generated files — not source code
  'src/**/*.test.ts',          // Test files themselves
  'src/test-utils/**',         // Test utilities (not production code)
  'src/**/*.d.ts',             // Type declaration files
  'dist/**',                   // Compiled output
]
```

### Coverage reporting

```bash
# Generate HTML coverage report
pnpm run test:coverage

# View in browser
open coverage/index.html
```

---

## 6.5 MSW Setup (Optional Enhancement)

For tests that need to assert on specific HTTP request details
(ForgeContainerAdapter, OfflineTokenManager), consider adding MSW v2:

```bash
pnpm --filter @forge-clients/core add -D msw
```

```typescript
// packages/core/src/test-utils/mswServer.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export { http, HttpResponse };
export const server = setupServer();
```

```typescript
// packages/core/src/adapters/ForgeContainerAdapter.test.ts (with MSW)
import { server, http, HttpResponse } from '../test-utils/mswServer.js';
import { beforeAll, afterAll, afterEach } from 'vitest';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('calls correct proxy URL for jira product', async () => {
  let capturedUrl = '';
  server.use(
    http.get('https://proxy.example.com/jira/*', ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json({});
    })
  );

  const adapter = new ForgeContainerAdapter({
    product: 'jira',
    installationId: 'install-123',
    egressProxyUrl: 'https://proxy.example.com',
  });
  await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'offlineUser', accountId: 'u1', accessToken: 'tok' } });

  expect(capturedUrl).toBe('https://proxy.example.com/jira/rest/api/3/myself');
});
```

---

## 6.6 CI Integration

Add test execution to the CI pipeline. Since this is a pnpm monorepo, the simplest
approach runs all tests from the workspace root:

```yaml
# Example: Bitbucket Pipelines
pipelines:
  default:
    - step:
        name: Test
        image: node:24
        caches:
          - node
        script:
          - npm install -g pnpm@9
          - pnpm install --frozen-lockfile
          - pnpm run test         # Runs all workspace tests
          - pnpm run test:coverage # Optional: generate coverage report
        artifacts:
          - coverage/**

# Example: GitHub Actions
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run test
      - run: pnpm run test:coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
```

### CI order of operations

Tests should run AFTER the spec pipeline but BEFORE publishing:

```
pnpm install              → install deps
pnpm -r run typecheck     → TypeScript checks
pnpm run test             → unit tests (this suite)
pnpm run build            → build packages
                          → [Publish to npm]
                          → [Deploy closed-loop tester] → integration tests
```

---

## 6.7 Implementation Plan

Ordered steps to go from zero tests to a complete test suite:

### Phase 1 — Infrastructure (0.5 days)

1. Create root `vitest.config.ts` (workspace mode)
2. Create per-package `vitest.config.ts` for core, generator, jira, confluence
3. Update all `package.json` scripts (test, test:watch, test:coverage)
4. Add `@vitest/coverage-v8` to devDependencies in each package
5. Create `packages/core/src/test-utils/MockForgeAdapter.ts` (from `01-mock-adapter.md`)
6. Export `MockForgeAdapter` from `@forge-clients/core/test-utils`
7. Verify `pnpm run test` runs (no test files yet → should pass trivially)

### Phase 2 — Core Utilities (1 day)

8. Write `packages/core/src/errors/ForgeApiError.test.ts`
9. Write `packages/core/src/retry/RetryHandler.test.ts`
10. Write `packages/core/src/pagination/PaginationHelper.test.ts`
11. Write `packages/core/src/auth/OfflineTokenManager.test.ts`
12. Verify all pass: `pnpm --filter @forge-clients/core run test`

### Phase 3 — Adapters (1 day)

13. Write `packages/core/src/adapters/ForgeFunctionAdapter.test.ts`
14. Write `packages/core/src/adapters/ForgeBridgeAdapter.test.ts`
15. Write `packages/core/src/adapters/ForgeContainerAdapter.test.ts`
16. Verify all pass

### Phase 4 — Generator (1.5 days)

17. Write `packages/generator/src/ir/SpecToIR.test.ts`
18. Write `packages/generator/src/emitters/TypeEmitter.test.ts`
19. Write `packages/generator/src/emitters/SdkEmitter.test.ts`
20. Write `packages/generator/src/__tests__/generator-integration.test.ts`
21. Write transforms tests (`fixNullableFields`, `fixErrorResponses`, `fixOneOfAnyOf`, etc.)
22. Write patch engine test (`applyPatches`)
23. Verify all pass: `pnpm --filter @forge-clients/generator run test`

### Phase 5 — Generated Function Tests (1 day)

24. Write `packages/jira/src/__tests__/getIssue.test.ts`
25. Write `packages/jira/src/__tests__/createIssue.test.ts`
26. Write `packages/jira/src/__tests__/deleteIssue.test.ts`
27. Write `packages/jira/src/__tests__/searchForIssuesUsingJqlPost.test.ts`
28. Write `packages/jira/src/__tests__/getCurrentUser.test.ts`
29. Write `packages/confluence/src/__tests__/getCurrentUser.test.ts`
30. Write `packages/confluence/src/__tests__/searchByCQL.test.ts`
31. Verify all pass

### Phase 6 — Coverage & CI (0.5 days)

32. Check coverage thresholds (`pnpm run test:coverage`)
33. Add coverage gates to CI config (fail if < 80% for core/generator)
34. Add test step to Bitbucket Pipelines / GitHub Actions config
35. Commit all test files and CI config
36. Open PR, verify CI green

**Estimated total: 5 days**

---

## 6.8 What Success Looks Like

```
 ✓ packages/core            48 tests  passed  (1.2s)
 ✓ packages/generator       31 tests  passed  (4.8s)
 ✓ packages/jira            22 tests  passed  (0.3s)
 ✓ packages/confluence       9 tests  passed  (0.2s)

 Test Files  110 passed (110)
 Tests       110 passed (110)
 Duration    6.5s

Coverage:
  @forge-clients/core       92.4% statements  ✓ (threshold: 90%)
  @forge-clients/generator  81.2% statements  ✓ (threshold: 80%)
  @forge-clients/specs      96.8% statements  ✓ (threshold: 95%)
```

No Forge runtime. No network calls. No installed app.
Pure unit tests that run in 6.5 seconds on any machine.
