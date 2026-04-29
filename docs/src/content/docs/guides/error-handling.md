---
title: Error Handling
description: Handling API errors from @forge-clients with typed error classes.
---

All errors thrown by generated functions are instances of typed `ForgeApiError` subclasses,
giving you precise control over error handling without parsing HTTP status codes manually.

## Error hierarchy

```
ForgeApiError (base)
├── BadRequestError        (400)
├── UnauthorizedError      (401)
├── ForbiddenError         (403)
├── NotFoundError          (404)
├── ConflictError          (409)
└── RateLimitError         (429) — includes retryAfterSeconds
```

## Basic error handling

```typescript
import {
  ForgeApiError,
  NotFoundError,
  ForbiddenError,
  RateLimitError,
} from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

try {
  const issue = await getIssue(adapter, { type: 'asApp' }, {
    issueIdOrKey: 'PROJ-123',
  });
  return issue;
} catch (err) {
  if (err instanceof NotFoundError) {
    // Issue doesn't exist or app doesn't have permission to see it
    return null;
  }
  if (err instanceof ForbiddenError) {
    // App lacks the required scope
    throw new Error('Missing scope: read:jira-work');
  }
  if (err instanceof RateLimitError) {
    // Rate limited — retry after the specified delay
    await new Promise(r => setTimeout(r, err.retryAfterSeconds * 1000));
    // retry...
  }
  if (err instanceof ForgeApiError) {
    // Catch all other API errors
    console.error(`API error ${err.statusCode}: ${err.message}`);
    throw err;
  }
  throw err; // Re-throw non-API errors
}
```

## Automatic retry for rate limits

The `withRetry` helper from `@forge-clients/core` automatically retries requests on
rate limit (429) and transient server errors (500, 502, 503, 504) with exponential backoff:

```typescript
import { withRetry } from '@forge-clients/core';
import { searchForIssuesUsingJqlPost } from '@forge-clients/jira/v3';

const result = await withRetry(
  () => searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
    body: { jql: 'project = PROJ ORDER BY created DESC', maxResults: 50 },
  }),
  { maxAttempts: 3, initialDelayMs: 1000 }
);
```

## Accessing error details

```typescript
import { ForgeApiError } from '@forge-clients/core';

try {
  await createIssue(adapter, { type: 'asApp' }, { body: { fields: {} } });
} catch (err) {
  if (err instanceof ForgeApiError) {
    console.log(err.statusCode);   // e.g. 400
    console.log(err.message);      // Human-readable message
    console.log(err.responseBody); // Raw response body string (for debugging)
    console.log(err.path);         // The API path that was called
  }
}
```

## RateLimitError — retryAfterSeconds

```typescript
import { RateLimitError } from '@forge-clients/core';

try {
  await doSomething();
} catch (err) {
  if (err instanceof RateLimitError) {
    // retryAfterSeconds is parsed from the Retry-After header.
    // Falls back to 60s if the header is missing.
    console.log(`Rate limited. Retry after ${err.retryAfterSeconds} seconds.`);
  }
}
```
