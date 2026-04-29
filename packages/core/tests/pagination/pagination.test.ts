import { describe, it, expect } from 'vitest';
import { collectAllPages, iteratePages } from '../../src/pagination/index.js';
import { MockForgeAdapter } from '../../src/test-utils/MockForgeAdapter.js';
import { asApp } from '../../src/client/BoundClient.js';

describe('collectAllPages', () => {
  it('collects all pages into a single array', async () => {
    const mock = new MockForgeAdapter();
    mock
      .queueResponse({ values: [1, 2, 3], isLast: false, startAt: 0, maxResults: 3, total: 6 })
      .queueResponse({ values: [4, 5, 6], isLast: true, startAt: 3, maxResults: 3, total: 6 });

    const client = asApp(mock);
    const results = await collectAllPages(
      (startAt) => client.adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/project/search',
        queryParams: { startAt, maxResults: 3 },
        authContext: client.authContext,
      }).then(r => r.json()),
      (page: { values: number[]; isLast: boolean }) => ({ items: page.values, isLast: page.isLast }),
    );

    expect(results).toEqual([1, 2, 3, 4, 5, 6]);
    expect(mock.callCount).toBe(2);
  });

  it('handles single page', async () => {
    const mock = new MockForgeAdapter();
    mock.queueResponse({ values: ['a', 'b'], isLast: true });

    const results = await collectAllPages(
      () => mock.fetch({ method: 'GET', path: '/x', authContext: { type: 'asApp' } }).then(r => r.json()),
      (page: { values: string[]; isLast: boolean }) => ({ items: page.values, isLast: page.isLast }),
    );

    expect(results).toEqual(['a', 'b']);
    expect(mock.callCount).toBe(1);
  });
});

describe('iteratePages', () => {
  it('yields items from each page', async () => {
    const mock = new MockForgeAdapter();
    mock
      .queueResponse({ values: ['x', 'y'], isLast: false })
      .queueResponse({ values: ['z'], isLast: true });

    const items: string[] = [];
    for await (const item of iteratePages(
      (startAt) => mock.fetch({
        method: 'GET', path: '/x', queryParams: { startAt }, authContext: { type: 'asApp' }
      }).then(r => r.json() as Promise<{ values: string[]; isLast: boolean }>),
      (page) => ({ items: page.values, isLast: page.isLast }),
    )) {
      items.push(item);
    }

    expect(items).toEqual(['x', 'y', 'z']);
  });
});
