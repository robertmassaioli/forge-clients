# Documentation Microsite — Planning Document

**Author:** Robert Massaioli  
**Date:** 2026-04-29  
**Status:** Proposed  
**Location:** Standalone site, deployed alongside `@forge-clients` npm packages

---

## 1. Goal

Produce a documentation microsite that gives Forge app developers everything they need to
start using `@forge-clients` confidently — from initial install through to advanced patterns
like user impersonation, pagination, and error handling. The site should feel like
first-class Atlassian developer documentation, not an afterthought README.

---

## 2. Recommended Tooling: Starlight (Astro)

**[Starlight](https://starlight.astro.build)** is the recommended framework.

### Why Starlight?

| Requirement | Starlight | Docusaurus | VitePress |
|---|---|---|---|
| Built-in full-text search (Pagefind) | ✅ Zero-config | ⚠️ Plugin | ⚠️ Plugin |
| TypeScript code blocks with syntax highlight | ✅ | ✅ | ✅ |
| Auto-generated API reference from TSDoc | ✅ via `@astrojs/starlight-typedoc` | ⚠️ Plugin | ⚠️ Plugin |
| Dark mode | ✅ | ✅ | ✅ |
| Zero-JS static output (fast load) | ✅ Astro islands | ❌ React bundle | ⚠️ Vue bundle |
| MDX support (interactive examples) | ✅ | ✅ | ❌ |
| Sidebar with versioning | ✅ | ✅ | ✅ |
| Deployment to GitHub/Bitbucket Pages | ✅ | ✅ | ✅ |

Starlight is built on Astro's zero-JS-by-default architecture. Since this is documentation
(not a web app), shipping zero JavaScript to users is the right choice — pages load
instantly. The `starlight-typedoc` plugin auto-generates API reference pages directly from
TSDoc comments in the source code, keeping docs in sync with the code.

---

## 3. Site Structure

```
docs/                                  ← Starlight project root
├── src/
│   └── content/
│       └── docs/
│           ├── index.mdx              ← Landing page
│           │
│           ├── getting-started/
│           │   ├── installation.md    ← Install + adapter choice
│           │   ├── quick-start.md     ← 5-minute hello world
│           │   └── concepts.md        ← Adapters, auth contexts, error model
│           │
│           ├── guides/
│           │   ├── forge-functions.md ← ForgeFunctionAdapter deep-dive
│           │   ├── custom-ui.md       ← ForgeBridgeAdapter (Custom UI)
│           │   ├── forge-containers.md← ForgeContainerAdapter
│           │   ├── forge-remote.md    ← ForgeRemoteAdapter (when implemented)
│           │   ├── auth-contexts.md   ← asApp vs asUser vs offlineUser
│           │   ├── error-handling.md  ← ForgeApiError hierarchy, retry
│           │   ├── pagination.md      ← collectAllPages, iteratePages
│           │   └── typescript.md      ← Type safety patterns, narrowing
│           │
│           ├── jira/
│           │   ├── overview.md        ← Jira API versions (v3/v2/software/sm)
│           │   ├── issues.md          ← Worked examples: CRUD on issues
│           │   ├── projects.md        ← Worked examples: projects
│           │   ├── users.md           ← Worked examples: users, myself
│           │   ├── search.md          ← Worked examples: JQL search
│           │   └── advanced.md        ← Custom fields, webhooks, boards
│           │
│           ├── confluence/
│           │   ├── overview.md        ← Confluence API versions
│           │   ├── pages.md           ← Worked examples: page CRUD
│           │   ├── spaces.md          ← Worked examples: spaces
│           │   └── search.md          ← Worked examples: CQL search
│           │
│           ├── generator/
│           │   ├── overview.md        ← Why the generator exists
│           │   ├── update-specs.md    ← Running update-specs
│           │   ├── generate.md        ← Running generate
│           │   └── customising.md     ← Transforms, patches, IR extension
│           │
│           └── reference/             ← Auto-generated from TSDoc by starlight-typedoc
│               ├── core/              ← @forge-clients/core API reference
│               ├── jira/              ← @forge-clients/jira function index
│               └── confluence/        ← @forge-clients/confluence function index
│
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## 4. Landing Page (`index.mdx`)

The landing page should communicate the value proposition immediately:

```mdx
---
title: @forge-clients
description: Type-safe Jira and Confluence REST API clients for Atlassian Forge apps
template: splash
hero:
  tagline: Named functions. Full types. Every Forge context.
  actions:
    - text: Quick Start
      link: /getting-started/quick-start/
      icon: right-arrow
      variant: primary
    - text: View on npm
      link: https://www.npmjs.com/package/@forge-clients/jira
      icon: external
---

import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="Named functions" icon="pencil">
    Every Jira and Confluence endpoint is a named, tree-shakeable async function.
    No more constructing URLs by hand.
  </Card>
  <Card title="Full TypeScript types" icon="document">
    Generated directly from Atlassian's OpenAPI specs. IDE autocomplete for every
    parameter and response shape.
  </Card>
  <Card title="Every Forge context" icon="setting">
    Works in Forge Functions, Custom UI, Containers, and Remotes via a
    pluggable adapter pattern.
  </Card>
  <Card title="asApp or asUser" icon="open-book">
    Switch between app credentials and user impersonation with a single
    parameter. No token management required.
  </Card>
</CardGrid>
```

---

## 5. Key Pages — Content Outlines

### 5.1 Quick Start (`getting-started/quick-start.md`)

The fastest path to a working Forge app using `@forge-clients`. Target: under 5 minutes.

```markdown
# Quick Start

## Install

npm install @forge-clients/jira @forge-clients/core

## Add to your Forge Function

import { ForgeFunctionAdapter } from '@forge-clients/core';
import { getIssue, searchProjects } from '@forge-clients/jira';

export const handler = resolver.define('getProjectsAndIssue', async ({ payload }) => {
  const adapter = new ForgeFunctionAdapter({ product: 'jira' });

  // Get all projects (asApp by default)
  const projects = await searchProjects(adapter, undefined, { maxResults: 10 });

  // Get a specific issue (asUser — acts as the calling user)
  const issue = await getIssue(
    adapter,
    { type: 'asUser' },
    { path: { issueIdOrKey: payload.issueKey } }
  );

  return { projects: projects.values, issue };
});

## That's it

No URL construction. No JSON parsing. No auth headers. Full TypeScript types throughout.
```

### 5.2 Concepts (`getting-started/concepts.md`)

Explains the three core abstractions:

1. **Adapters** — The transport layer. Each Forge execution context has its own adapter.
   Table mapping context → adapter:

   | Forge Context | Adapter | Notes |
   |---|---|---|
   | Forge Function (resolver) | `ForgeFunctionAdapter` | Uses `@forge/api` + `assumeTrustedRoute` |
   | Custom UI (browser) | `ForgeBridgeAdapter` | Uses `@forge/bridge`, always `asUser` |
   | Forge Container | `ForgeContainerAdapter` | Uses egress proxy, supports offline tokens |
   | Forge Remote | `ForgeRemoteAdapter` *(planned)* | Uses egress proxy + payload tokens |

2. **Auth Contexts** — `{ type: 'asApp' }`, `{ type: 'asUser', userId? }`, `{ type: 'offlineUser', accountId, accessToken }`

3. **Error Model** — `ForgeApiError` hierarchy with `status`, `message`, `path`, and typed subclasses for common HTTP errors.

### 5.3 Error Handling (`guides/error-handling.md`)

Worked examples for every error scenario:

```typescript
import { ForgeApiError, NotFoundError, RateLimitError, withRetry } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira';

// Basic error handling
try {
  const issue = await getIssue(adapter, undefined, { path: { issueIdOrKey: 'PROJ-999' } });
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('Issue does not exist');
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${err.retryAfterMs}ms`);
  } else if (err instanceof ForgeApiError) {
    console.log(`API error ${err.status}: ${err.message}`);
  }
}

// Automatic retry with exponential backoff
const issue = await withRetry(() =>
  getIssue(adapter, undefined, { path: { issueIdOrKey: 'PROJ-123' } })
);
```

### 5.4 Pagination (`guides/pagination.md`)

Three patterns: manual, iterator, collect-all:

```typescript
import { collectAllPages, iteratePages } from '@forge-clients/core';
import { searchProjects } from '@forge-clients/jira';

// Pattern 1: Collect everything (use with care on large datasets)
const allProjects = await collectAllPages(
  (startAt) => searchProjects(adapter, undefined, { startAt, maxResults: 50 }),
  (page) => page.values ?? [],
  (page) => page.isLast ?? true,
);

// Pattern 2: Async iterator (process page by page)
for await (const page of iteratePages(
  (startAt) => searchProjects(adapter, undefined, { startAt, maxResults: 50 }),
  (page) => page.values ?? [],
  (page) => page.isLast ?? true,
)) {
  await processProjects(page);
}

// Pattern 3: Manual (full control)
let startAt = 0;
let isLast = false;
while (!isLast) {
  const page = await searchProjects(adapter, undefined, { startAt, maxResults: 50 });
  await processProjects(page.values ?? []);
  isLast = page.isLast ?? true;
  startAt += page.values?.length ?? 0;
}
```

### 5.5 Jira: Issues (`jira/issues.md`)

Complete worked examples for the most common Jira use cases:

```typescript
import { ForgeFunctionAdapter } from '@forge-clients/core';
import {
  getIssue,
  createIssue,
  editIssue,
  deleteIssue,
  searchForIssuesUsingJqlPost,
} from '@forge-clients/jira';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });

// Create an issue
const created = await createIssue(adapter, undefined, {
  body: {
    fields: {
      project: { key: 'PROJ' },
      summary: 'My new issue',
      issuetype: { name: 'Task' },
      description: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
      },
    },
  },
});
console.log(`Created: ${created.key}`);

// Read an issue
const issue = await getIssue(adapter, undefined, {
  path: { issueIdOrKey: created.key! },
  fields: ['summary', 'status', 'assignee'],
});

// Update an issue
await editIssue(adapter, undefined, {
  path: { issueIdOrKey: created.key! },
  body: { fields: { summary: 'Updated summary' } },
});

// JQL search
const results = await searchForIssuesUsingJqlPost(adapter, undefined, {
  body: {
    jql: 'project = PROJ AND status = "In Progress"',
    maxResults: 20,
    fields: ['summary', 'status', 'assignee'],
  },
});
console.log(`Found ${results.total} issues`);

// Delete
await deleteIssue(adapter, undefined, { path: { issueIdOrKey: created.key! } });
```

### 5.6 Auth Contexts Deep Dive (`guides/auth-contexts.md`)

```typescript
import { ForgeFunctionAdapter } from '@forge-clients/core';
import { getCurrentUser, createIssue } from '@forge-clients/jira';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });

// asApp (default) — app acts with its own identity
// Calls are attributed to the app, not any user
const appUser = await getCurrentUser(adapter);
// → returns the app's Atlassian identity

// asUser (with invoking user context) — app acts as the current user
// The user must have consented via OAuth; requires impersonation: true in manifest scopes
const userContext = { type: 'asUser' } as const;
const me = await getCurrentUser(adapter, userContext);
// → returns the currently-logged-in user's profile

// asUser (explicit user ID) — offline impersonation
// Works in scheduled automations, webhooks, backend processes
const issueCreatedAsUser = await createIssue(
  adapter,
  { type: 'asUser', userId: '5b10a2844c20165700ede21g' },
  { body: { fields: { project: { key: 'PROJ' }, summary: 'Created as a specific user', issuetype: { name: 'Task' } } } }
);

// Required manifest.yml scopes for asUser:
// scopes:
//   - write:jira-work
//     impersonation: true
```

### 5.7 Generator Guide (`generator/overview.md`)

For library maintainers and contributors who need to regenerate the clients when Atlassian
updates their specs:

```bash
# Step 1: Download and clean the latest specs from Atlassian
npx @forge-clients/generator update-specs

# Step 2: Regenerate all TypeScript clients from the cleaned specs
npx @forge-clients/generator generate

# Step 3: Rebuild the packages
pnpm -r run build

# Step 4: Run the closed-loop tester to verify nothing broke
curl -X POST "<webtrigger-url>" -d '{"suite":"all"}' | jq .
```

The guide explains:
- The spec pipeline: download → transforms → patches → cleaned JSON
- The IR pipeline: spec → SpecToIR → TypeEmitter/SdkEmitter → generated TS
- How to add a transform (for new spec defects)
- How to add a patch (for one-off operationId fixes)
- How to add a new API target (new Jira/Confluence API version)

---

## 6. Auto-Generated API Reference

The `@astrojs/starlight-typedoc` plugin reads TSDoc comments from the source and generates
a full API reference. Every generated function will appear with:

- **Signature** — parameter types and return type
- **Parameters** — table of all params with descriptions (from JSDoc in generated code)
- **`@forge-scopes-asApp`** — which manifest scope is required for asApp calls
- **`@forge-scopes-asUser`** — which scope requires `impersonation: true`
- **`@deprecated`** — clearly flagged in the reference if the endpoint is deprecated

The reference is automatically regenerated when `pnpm run generate` runs, so it stays in
sync with the code without manual effort.

---

## 7. Code Examples — Design Principles

All worked examples across the site should follow these rules:

1. **Show the imports** — never assume the reader knows where things come from
2. **Show the adapter creation** — always start with `new ForgeFunctionAdapter(...)` so the
   pattern is reinforced
3. **Prefer `asApp` default** for simple examples (less noise), `asUser` for examples
   where user context matters
4. **Handle errors** — at least show a `try/catch` in every terminal example
5. **Use real endpoint names** — no invented APIs like `getThings()`; use actual generated
   function names like `searchForIssuesUsingJqlPost()`
6. **Include the manifest scope** — every example should include a comment showing which
   scope is required:
   ```typescript
   // manifest.yml: scopes: [read:jira-work]
   const projects = await searchProjects(adapter, undefined, { maxResults: 10 });
   ```
7. **No credentials in examples** — adapters handle all auth; examples never show tokens,
   API keys, or passwords

---

## 8. Interactive Playground (Optional Enhancement)

A secondary enhancement (not MVP) would be a browser-based playground where developers
can paste their Jira site URL and an API token and try API calls directly in the browser.
This would use `openapi-fetch` (from Option 2's tech stack) as the browser-side transport
since `@forge/api` is not available outside Forge.

This is explicitly **out of scope for the initial launch** — document it here as a future
consideration.

---

## 9. Deployment

### Option A: Bitbucket/GitHub Pages (Recommended for MVP)

```yaml
# .github/workflows/docs.yml  OR  bitbucket-pipelines.yml
- run: cd docs && pnpm install && pnpm run build
- deploy: dist/ → GitHub Pages / Bitbucket Pages
```

URL pattern: `https://rmassaioli.github.io/forge-clients/` or similar.

### Option B: Vercel / Netlify (Better DX)

One-click deploy with automatic preview deployments on every PR. Free tier covers static
sites. Gives a cleaner custom domain story.

### Option C: Atlassian Developer Hub (Long-term)

If `@forge-clients` becomes an official or widely-adopted community library, the docs
could be submitted to `developer.atlassian.com/forge-marketplace` or similar. Not
relevant for initial release.

**Recommendation: Start with Vercel.** Zero-config Astro deployment, preview URLs on
every commit, easy custom domain, free tier.

---

## 10. Monorepo Integration

The docs site lives inside the `forge-clients` monorepo at `packages/docs/` (or a
top-level `docs/` directory). It is a pnpm workspace member:

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'docs'          # ← add the docs site
```

The `@astrojs/starlight-typedoc` plugin reads the TypeScript source directly, so it must
be a workspace member to access the other packages via workspace links.

**Package name:** `@forge-clients/docs` (private, never published to npm)

---

## 11. Implementation Plan

### Phase 1 — Scaffold (1–2 days)
1. Create `docs/` directory, init Starlight project (`npm create astro@latest -- --template starlight`)
2. Configure `astro.config.mjs` — sidebar structure, site title, favicon, social links
3. Add `@astrojs/starlight-typedoc` plugin, point at `packages/core/src/index.ts`
4. Add pnpm workspace entry for `docs/`
5. Add `docs:dev`, `docs:build`, `docs:preview` scripts to root `package.json`
6. Set up Vercel deployment

### Phase 2 — Core Content (3–5 days)
7. Write `index.mdx` — landing page with feature cards
8. Write `getting-started/installation.md`
9. Write `getting-started/quick-start.md` — 5-minute hello world
10. Write `getting-started/concepts.md` — adapters, auth contexts, error model
11. Write `guides/forge-functions.md` — `ForgeFunctionAdapter` deep-dive
12. Write `guides/auth-contexts.md` — asApp vs asUser with manifest snippets
13. Write `guides/error-handling.md` — all error types with examples
14. Write `guides/pagination.md` — three pagination patterns

### Phase 3 — Product Guides (3–4 days)
15. Write `jira/issues.md` — CRUD worked examples
16. Write `jira/projects.md` — project listing, search
17. Write `jira/users.md` — getCurrentUser, asUser patterns
18. Write `jira/search.md` — JQL search patterns
19. Write `confluence/pages.md` — page CRUD
20. Write `confluence/search.md` — CQL search

### Phase 4 — Generator Guide (1–2 days)
21. Write `generator/overview.md`
22. Write `generator/update-specs.md`
23. Write `generator/generate.md`
24. Write `generator/customising.md`

### Phase 5 — Polish (1–2 days)
25. Review all code examples against the live closed-loop tester (run each example)
26. Add `@forge-scopes-*` JSDoc to all generated functions so they appear in API reference
27. Add custom CSS to match Atlassian's brand colours
28. Write a CONTRIBUTING.md for the docs (how to add examples, style guide)
29. Commit, tag `v0.1.0-docs`, deploy

**Estimated total: 9–15 days of focused work.**

---

## 12. Content That Does Not Yet Exist (Prerequisite Work)

Some docs pages cannot be written until the corresponding features are implemented:

| Page | Prerequisite |
|---|---|
| `guides/custom-ui.md` | `ForgeBridgeAdapter` needs real-world testing |
| `guides/forge-containers.md` | `ForgeContainerAdapter` needs real-world testing |
| `guides/forge-remote.md` | `ForgeRemoteAdapter` not yet implemented (see `forge-remote-adapter.md`) |
| `guides/pagination.md` (auto) | Automatic pagination helpers not yet generated |
| All `@forge-scopes-*` in API reference | JSDoc annotations not yet in generated code |

These pages should be scaffolded with "Coming Soon" notices at launch and filled in as the
features land.

---

## 13. Success Metrics

- **Time to first working code:** A developer who has never used `@forge-clients` should
  be able to make their first successful Jira API call within 10 minutes of landing on the
  site.
- **Zero docs drift:** The API reference is auto-generated — it is always in sync with
  the published packages.
- **Search coverage:** Every function name in `@forge-clients/jira` and
  `@forge-clients/confluence` is findable via the site's full-text search.

---

*This proposal should be implemented after the initial npm package release so that the
docs site can be tested against real published packages rather than local file:// links.*
