import { describe, it, expect } from 'vitest';
import { collectAllPages, iteratePages, iterateCursorPages } from '../../src/pagination/index.js';
import type { OffsetPage } from '../../src/pagination/index.js';
import { MockForgeAdapter } from '../../src/test-utils/MockForgeAdapter.js';

describe('collectAllPages', () => {
  it('collects all pages into a single array using total', async () => {
    // fetchPage returns OffsetPage<number> directly — no mapper callback
    let call = 0;
    const pages: OffsetPage<number>[] = [
      { values: [1, 2, 3], startAt: 0, maxResults: 3, total: 6 },
      { values: [4, 5, 6], startAt: 3, maxResults: 3, total: 6 },
    ];

    const results = await collectAllPages<number>(
      async (startAt, maxResults) => {
        const page = pages[call++]!;
        return page;
      },
      3,
    );

    expect(results).toEqual([1, 2, 3, 4, 5, 6]);
    expect(call).toBe(2);
  });

  it('handles single page using isLast flag', async () => {
    const results = await collectAllPages<string>(
      async () => ({ values: ['a', 'b'], isLast: true }),
      50,
    );

    expect(results).toEqual(['a', 'b']);
  });

  it('stops when items returned is less than pageSize', async () => {
    let call = 0;
    const results = await collectAllPages<number>(
      async (startAt) => {
        call++;
        // First page is full, second page is partial
        return call === 1
          ? { values: [1, 2, 3] }
          : { values: [4] };
      },
      3,
    );

    expect(results).toEqual([1, 2, 3, 4]);
    expect(call).toBe(2);
  });
});

describe('iteratePages', () => {
  it('yields items from each page using isLast flag', async () => {
    let call = 0;
    // pageSize=2 so items.length < pageSize only triggers on the last page
    const pages: OffsetPage<string>[] = [
      { values: ['x', 'y'], isLast: false },
      { values: ['z'], isLast: true },
    ];

    const items: string[] = [];
    for await (const item of iteratePages<string>(
      async () => pages[call++]!,
      2, // pageSize matches first page length so only isLast stops iteration
    )) {
      items.push(item as string);
    }

    expect(items).toEqual(['x', 'y', 'z']);
    expect(call).toBe(2);
  });

  it('uses MockForgeAdapter to simulate a real paginated fetch', async () => {
    const mock = new MockForgeAdapter();
    mock
      .queueResponse({ issues: ['ISS-1', 'ISS-2'], total: 3 })
      .queueResponse({ issues: ['ISS-3'], total: 3 });

    const items: string[] = [];
    for await (const item of iteratePages<string>(
      async (startAt, maxResults) => mock.fetch({
        method: 'GET',
        path: '/rest/api/3/search',
        queryParams: { startAt, maxResults },
        authContext: { type: 'asApp' },
      }).then(r => r.json() as Promise<OffsetPage<string>>),
      2,
    )) {
      items.push(item as string);
    }

    expect(items).toEqual(['ISS-1', 'ISS-2', 'ISS-3']);
    expect(mock.callCount).toBe(2);
  });
});

describe('iterateCursorPages', () => {
  it('yields all items across cursor-paginated pages', async () => {
    let call = 0;
    const pages = [
      { results: ['a', 'b'], _links: { next: '/wiki/api/v2/pages?cursor=cursor-2' } },
      { results: ['c'], _links: {} },
    ];

    const items: string[] = [];
    for await (const item of iterateCursorPages<string>(
      async (_cursor) => pages[call++]! as any,
    )) {
      items.push(item);
    }

    expect(items).toEqual(['a', 'b', 'c']);
    expect(call).toBe(2);
  });

  it('passes undefined cursor on first page', async () => {
    const cursors: (string | undefined)[] = [];
    const pages = [
      { results: ['x'], _links: { next: '/api?cursor=next' } },
      { results: ['y'], _links: {} },
    ];
    let call = 0;

    for await (const _ of iterateCursorPages<string>(
      async (cursor) => { cursors.push(cursor); return pages[call++]! as any; },
    )) { /* consume */ }

    expect(cursors[0]).toBeUndefined();
  });

  it('extracts cursor from _links.next URL', async () => {
    const cursors: (string | undefined)[] = [];
    const pages = [
      { results: ['x'], _links: { next: '/wiki/api/v2/pages?cursor=abc123&limit=25' } },
      { results: ['y'], _links: {} },
    ];
    let call = 0;

    for await (const _ of iterateCursorPages<string>(
      async (cursor) => { cursors.push(cursor); return pages[call++]! as any; },
    )) { /* consume */ }

    expect(cursors[1]).toBe('abc123');
  });

  it('stops when _links.next is absent', async () => {
    let call = 0;
    for await (const _ of iterateCursorPages<string>(
      async () => { call++; return { results: ['only'], _links: {} } as any; },
    )) { /* consume */ }
    expect(call).toBe(1);
  });

  it('handles empty results page', async () => {
    const items: string[] = [];
    for await (const item of iterateCursorPages<string>(
      async () => ({ results: [], _links: {} } as any),
    )) { items.push(item); }
    expect(items).toEqual([]);
  });
});
