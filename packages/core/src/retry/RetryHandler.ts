/**
 * Retry handler with exponential backoff for `@forge-clients` packages.
 *
 * Automatically handles rate limit (429) and transient server (503) errors
 * with configurable retry logic. Honours the Retry-After header from 429 responses.
 */

import { ForgeApiError, RateLimitError } from '../errors/ForgeApiError.js';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Multiplier applied to delay after each retry (default: 2) */
  backoffFactor?: number;
  /** HTTP status codes that should trigger a retry (default: [429, 503]) */
  retryOn?: number[];
  /** Optional callback invoked before each retry */
  onRetry?: (attempt: number, error: ForgeApiError, delayMs: number) => void;
}

/**
 * Wraps an async operation with retry logic.
 *
 * @example
 * const issue = await withRetry(
 *   () => getIssue(client, { issueIdOrKey: 'PROJ-123' }),
 *   { maxRetries: 3 },
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffFactor = 2,
    retryOn = [429, 503],
    onRetry,
  } = opts;

  let lastError: unknown;
  let delayMs = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!(error instanceof ForgeApiError)) throw error;
      if (!retryOn.includes(error.status)) throw error;
      if (attempt >= maxRetries) throw error;

      // Honour Retry-After header for rate limit responses
      if (error instanceof RateLimitError && error.retryAfterSeconds !== null) {
        delayMs = error.retryAfterSeconds * 1000;
      }

      onRetry?.(attempt + 1, error, delayMs);

      await sleep(delayMs);
      delayMs = Math.round(delayMs * backoffFactor);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
