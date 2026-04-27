/**
 * Pagination helpers for Atlassian REST APIs.
 *
 * Atlassian APIs use several different pagination schemes:
 * - Offset-based: startAt / maxResults / total / values (most Jira endpoints)
 * - Cursor-based: cursor / nextPage (some Confluence v2 endpoints)
 * - isLast flag: isLast boolean (Jira Software endpoints)
 */

export interface OffsetPage<T> {
  values?: T[];
  issues?: T[];
  results?: T[];
  total?: number;
  isLast?: boolean;
  startAt?: number;
  maxResults?: number;
}

export interface CursorPage<T> {
  results: T[];
  _links?: {
    next?: string;
  };
}

/**
 * Collect ALL pages of an offset-paginated endpoint into a single array.
 * Use iteratePages() instead for large result sets to avoid loading all into memory.
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
 * @example
 * for await (const issue of iteratePages(
 *   (startAt, maxResults) => searchIssues(client, { body: { jql, startAt, maxResults } }),
 * )) {
 *   console.log(issue.key);
 * }
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
 * Async generator for cursor-paginated endpoints (some Confluence v2 endpoints).
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
