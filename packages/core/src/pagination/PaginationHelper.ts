/**
 * Pagination helpers for Atlassian REST APIs.
 *
 * Atlassian APIs use several different pagination schemes:
 * - Offset-based: startAt / maxResults / total / values (most Jira endpoints)
 * - Cursor-based: cursor / nextPage (some Confluence v2 endpoints)
 * - isLast flag: isLast boolean (Jira Software endpoints)
 */

/**
 * Represents one page of results from an offset-paginated Atlassian API endpoint.
 *
 * Atlassian APIs use various field names for items (`values`, `issues`, `results`)
 * and various ways to signal the last page (`isLast`, `total`). This interface
 * unifies them so the pagination helpers work across all endpoints.
 */
export interface OffsetPage<T> {
  /** Items returned by most Jira and Confluence endpoints */
  values?: T[];
  /** Items returned by Jira issue search endpoints */
  issues?: T[];
  /** Items returned by some Confluence and Jira Software endpoints */
  results?: T[];
  /** Total number of items across all pages (not always present) */
  total?: number;
  /** `true` when this is the final page (used by Jira Software endpoints) */
  isLast?: boolean;
  /** Zero-based index of the first item on this page */
  startAt?: number;
  /** Maximum number of items per page */
  maxResults?: number;
}

/**
 * Represents one page of results from a cursor-paginated Atlassian API endpoint.
 * Used by some Confluence v2 endpoints.
 */
export interface CursorPage<T> {
  /** Items on this page */
  results: T[];
  /** HAL-style links object — `next` contains the URL of the next page if present */
  _links?: {
    next?: string;
  };
}

/**
 * Collect **all** pages of an offset-paginated endpoint into a single array.
 *
 * Fetches pages sequentially until the last page is reached, then returns
 * all items concatenated. For large result sets, prefer {@link iteratePages}
 * to avoid loading everything into memory at once.
 *
 * @param fetchPage - A function that fetches one page given `startAt` and `maxResults`
 * @param pageSize  - Number of items to request per page (default: 50)
 *
 * @example
 * ```typescript
 * import { collectAllPages } from '@forge-clients/core';
 * import { searchForIssuesUsingJql } from '@forge-clients/jira/v3';
 *
 * const allIssues = await collectAllPages(
 *   (startAt, maxResults) =>
 *     searchForIssuesUsingJql(client, { body: { jql: 'project = PROJ', startAt, maxResults } }),
 * );
 * console.log(`Found ${allIssues.length} issues`);
 * ```
 */
export async function collectAllPages<T>(
  fetchPage: (startAt: number, maxResults: number) => Promise<OffsetPage<T>>,
  pageSize = 50,
): Promise<T[]> {
  const results: T[] = [];
  let startAt = 0;

  while (true) {
    const page = await fetchPage(startAt, pageSize);
    const items = page.values ?? page.issues ?? page.results ?? [];
    results.push(...items);

    if (items.length < pageSize) break;
    if (page.isLast === true) break;
    if (page.total !== undefined && results.length >= page.total) break;

    startAt += items.length;
  }

  return results;
}

/**
 * Async generator for memory-efficient iteration over offset-paginated results.
 *
 * Yields one item at a time, fetching the next page on demand. Use this instead
 * of {@link collectAllPages} when result sets may be large or when you want to
 * stop early (e.g. `break` out of the loop once a match is found).
 *
 * @param fetchPage - A function that fetches one page given `startAt` and `maxResults`
 * @param pageSize  - Number of items to request per page (default: 50)
 *
 * @example
 * ```typescript
 * import { iteratePages } from '@forge-clients/core';
 * import { searchForIssuesUsingJql } from '@forge-clients/jira/v3';
 *
 * for await (const issue of iteratePages(
 *   (startAt, maxResults) =>
 *     searchForIssuesUsingJql(client, { body: { jql: 'project = PROJ', startAt, maxResults } }),
 * )) {
 *   console.log(issue.key);
 *   if (issue.key === 'PROJ-42') break; // stop early without fetching remaining pages
 * }
 * ```
 */
export async function* iteratePages<T>(
  fetchPage: (startAt: number, maxResults: number) => Promise<OffsetPage<T>>,
  pageSize = 50,
): AsyncGenerator<T> {
  let startAt = 0;

  while (true) {
    const page = await fetchPage(startAt, pageSize);
    const items = page.values ?? page.issues ?? page.results ?? [];

    for (const item of items) {
      yield item;
    }

    if (items.length < pageSize) break;
    if (page.isLast === true) break;
    if (page.total !== undefined && startAt + items.length >= page.total) break;

    startAt += items.length;
  }
}

/**
 * Async generator for memory-efficient iteration over cursor-paginated results.
 *
 * Used with Confluence v2 endpoints that return a `_links.next` URL instead of
 * an offset. Yields one item at a time and extracts the cursor from the `next`
 * link automatically. Stops when there is no `next` link.
 *
 * @param fetchPage - A function that fetches one page; receives `undefined` for the
 *                    first page and a cursor string for subsequent pages
 *
 * @example
 * ```typescript
 * import { iterateCursorPages } from '@forge-clients/core';
 * import { getPages } from '@forge-clients/confluence/v2';
 *
 * for await (const page of iterateCursorPages(
 *   (cursor) => getPages(client, { query: { spaceKey: 'MYSPACE', cursor } }),
 * )) {
 *   console.log(page.title);
 * }
 * ```
 */
export async function* iterateCursorPages<T>(
  fetchPage: (cursor?: string) => Promise<CursorPage<T>>,
): AsyncGenerator<T> {
  let cursor: string | undefined;

  while (true) {
    const page = await fetchPage(cursor);

    for (const item of page.results) {
      yield item;
    }

    const nextLink = page._links?.next;
    if (!nextLink) break;

    // Extract cursor from the next link URL
    const url = new URL(nextLink, 'https://placeholder.example');
    cursor = url.searchParams.get('cursor') ?? undefined;
    if (!cursor) break;
  }
}
