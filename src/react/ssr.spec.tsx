import React from 'react';
import { renderToString } from 'react-dom/server';
import { VirtualGrid } from './VirtualGrid';
import { VirtualList } from './VirtualList';

describe('SSR fallback', () => {
  it('renders first N list items on server', () => {
    const items = Array.from({ length: 8 }, (_, index) => ({ id: index }));
    const html = renderToString(
      <VirtualList
        items={items}
        itemKey={(item) => item.id}
        renderItem={({ index }) => <div data-testid={`item-${index}`} />}
        layout={{ sizeMode: 'fixed', itemSize: 10 }}
        ssr={{ count: 3 }}
      />,
    );

    expect(html).toContain('data-testid="item-0"');
    expect(html).toContain('data-testid="item-2"');
    expect(html).not.toContain('data-testid="item-3"');
  });

  it('renders first rows and columns for grid on server', () => {
    const html = renderToString(
      <VirtualGrid
        rowCount={5}
        columnCount={5}
        rows={{ sizeMode: 'fixed', itemSize: 20 }}
        columns={{ sizeMode: 'fixed', itemSize: 30 }}
        renderCell={({ rowIndex, columnIndex }) => (
          <div data-testid={`cell-${rowIndex}-${columnIndex}`} />
        )}
        ssr={{ rows: 2, columns: 2 }}
      />,
    );

    expect(html).toContain('data-testid="cell-0-0"');
    expect(html).toContain('data-testid="cell-1-1"');
    expect(html).not.toContain('data-testid="cell-2-0"');
    expect(html).not.toContain('data-testid="cell-0-2"');
  });
});
