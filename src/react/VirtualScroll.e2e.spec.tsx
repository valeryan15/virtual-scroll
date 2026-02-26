import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualGrid } from './VirtualGrid';
import { VirtualList } from './VirtualList';
import type { VirtualGridHandle, VirtualListHandle } from './types';

const viewportStyle: React.CSSProperties = {
  width: 320,
  height: 220,
  overflow: 'auto',
  border: '1px solid #ccc',
};

const listViewportClass = 'e2e-list-viewport';
const gridViewportClass = 'e2e-grid-viewport';

const waitForPaint = async () => {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  });
};

const getViewport = (container: HTMLElement, className: string): HTMLElement => {
  const viewport = container.querySelector(`.${className}`);
  if (!(viewport instanceof HTMLElement)) {
    throw new Error('Viewport not found');
  }

  return viewport;
};

describe('Playwright e2e: VirtualList', () => {
  it('renders visible range and updates on scroll', async () => {
    const items = Array.from({ length: 120 }, (_, index) => ({ id: index, label: `Item ${index}` }));
    const { container, queryByTestId } = render(
      <VirtualList
        items={items}
        itemKey={(item) => item.id}
        renderItem={({ item }) => <div data-testid={`item-${item.id}`}>{item.label}</div>}
        layout={{ sizeMode: 'fixed', itemSize: 24 }}
        overscan={0}
        style={viewportStyle}
        className={listViewportClass}
      />,
    );

    const viewport = getViewport(container, listViewportClass);
    await waitFor(() => {
      expect(queryByTestId('item-0')).toBeTruthy();
      expect(queryByTestId('item-20')).toBeFalsy();
    });

    act(() => {
      viewport.scrollTop = 24 * 20;
      fireEvent.scroll(viewport);
    });

    await waitFor(() => {
      expect(queryByTestId('item-0')).toBeFalsy();
      expect(queryByTestId('item-20')).toBeTruthy();
    });
  });

  it('keeps controlled scroll position without loop', async () => {
    const ControlledList = () => {
      const [position, setPosition] = React.useState({ top: 0, left: 0 });

      return (
        <VirtualList
          items={Array.from({ length: 120 }, (_, index) => ({ id: index }))}
          itemKey={(item) => item.id}
          renderItem={({ item }) => <div data-testid={`item-${item.id}`}>{item.id}</div>}
          layout={{ sizeMode: 'fixed', itemSize: 24 }}
          overscan={0}
          scroll={{
            position,
            onScroll: (next) => setPosition(next),
          }}
          style={viewportStyle}
          className={listViewportClass}
        />
      );
    };

    const { container } = render(<ControlledList />);
    const viewport = getViewport(container, listViewportClass);

    act(() => {
      viewport.scrollTop = 180;
      fireEvent.scroll(viewport);
    });

    await waitFor(() => {
      expect(Math.round(viewport.scrollTop)).toBe(180);
    });
  });

  it('recalculates dynamic sticky extents after resize without scroll jump', async () => {
    const listRef = React.createRef<VirtualListHandle>();

    const Scenario = () => {
      const [expanded, setExpanded] = React.useState(false);
      const stickyTopHeight = expanded ? 80 : 36;
      const stickyBottomHeight = expanded ? 72 : 36;

      return (
        <div>
          <button
            type='button'
            data-testid='toggle-sticky'
            onClick={() => setExpanded((prev) => !prev)}
          >
            toggle sticky
          </button>
          <VirtualList
            ref={listRef}
            items={Array.from({ length: 200 }, (_, index) => ({ id: index, label: `Item ${index}` }))}
            itemKey={(item) => item.id}
            renderItem={({ item }) => <div data-testid={`item-${item.id}`}>{item.label}</div>}
            layout={{ sizeMode: 'dynamic', estimatedItemSize: 30 }}
            overscan={0}
            sticky={{
              top: 1,
              bottom: 1,
              renderStickyTop: ({ items: stickyItems }) => (
                <div
                  data-testid='sticky-top-content'
                  style={{ height: stickyTopHeight, display: 'flex', alignItems: 'center' }}
                >
                  {stickyItems[0]?.label}
                </div>
              ),
              renderStickyBottom: ({ items: stickyItems }) => (
                <div
                  data-testid='sticky-bottom-content'
                  style={{ height: stickyBottomHeight, display: 'flex', alignItems: 'center' }}
                >
                  {stickyItems[0]?.label}
                </div>
              ),
            }}
            style={viewportStyle}
            className={listViewportClass}
          />
        </div>
      );
    };

    const { container, getByTestId } = render(<Scenario />);
    const viewport = getViewport(container, listViewportClass);

    act(() => {
      viewport.scrollTop = 300;
      fireEvent.scroll(viewport);
    });

    await waitForPaint();
    const beforeScrollTop = viewport.scrollTop;

    act(() => {
      fireEvent.click(getByTestId('toggle-sticky'));
    });

    await waitForPaint();
    act(() => {
      listRef.current?.measure();
    });

    await waitFor(() => {
      expect(Math.round(viewport.scrollTop)).toBe(Math.round(beforeScrollTop));
    });
  });

  it('scrolls to item by imperative handle', async () => {
    const listRef = React.createRef<VirtualListHandle>();
    const { container } = render(
      <VirtualList
        ref={listRef}
        items={Array.from({ length: 200 }, (_, index) => ({ id: index }))}
        itemKey={(item) => item.id}
        renderItem={({ item }) => <div>{item.id}</div>}
        layout={{ sizeMode: 'fixed', itemSize: 25 }}
        overscan={0}
        style={viewportStyle}
        className={listViewportClass}
      />,
    );

    const viewport = getViewport(container, listViewportClass);
    act(() => {
      listRef.current?.scrollToIndex(50);
    });

    await waitFor(() => {
      expect(viewport.scrollTop).toBe(1250);
    });
  });
});

describe('Playwright e2e: VirtualGrid', () => {
  it('renders visible grid window and updates on scroll', async () => {
    const { container, queryByTestId } = render(
      <VirtualGrid
        rowCount={120}
        columnCount={120}
        rows={{ sizeMode: 'fixed', itemSize: 30 }}
        columns={{ sizeMode: 'fixed', itemSize: 40 }}
        overscan={0}
        renderCell={({ rowIndex, columnIndex }) => <div data-testid={`cell-${rowIndex}-${columnIndex}`} />}
        style={viewportStyle}
        className={gridViewportClass}
      />,
    );
    const viewport = getViewport(container, gridViewportClass);

    await waitFor(() => {
      expect(queryByTestId('cell-0-0')).toBeTruthy();
      expect(queryByTestId('cell-20-20')).toBeFalsy();
    });

    act(() => {
      viewport.scrollTop = 30 * 20;
      viewport.scrollLeft = 40 * 20;
      fireEvent.scroll(viewport);
    });

    await waitFor(() => {
      expect(queryByTestId('cell-0-0')).toBeFalsy();
      expect(queryByTestId('cell-20-20')).toBeTruthy();
    });
  });

  it('keeps controlled grid scroll position without loop', async () => {
    const ControlledGrid = () => {
      const [position, setPosition] = React.useState({ top: 0, left: 0 });

      return (
        <VirtualGrid
          rowCount={120}
          columnCount={120}
          rows={{ sizeMode: 'fixed', itemSize: 30 }}
          columns={{ sizeMode: 'fixed', itemSize: 40 }}
          overscan={0}
          renderCell={({ rowIndex, columnIndex }) => <div>{`${rowIndex}-${columnIndex}`}</div>}
          scroll={{
            position,
            onScroll: (next) => setPosition(next),
          }}
          style={viewportStyle}
          className={gridViewportClass}
        />
      );
    };

    const { container } = render(<ControlledGrid />);
    const viewport = getViewport(container, gridViewportClass);

    act(() => {
      viewport.scrollTop = 270;
      viewport.scrollLeft = 320;
      fireEvent.scroll(viewport);
    });

    await waitFor(() => {
      expect(Math.round(viewport.scrollTop)).toBe(270);
      expect(Math.round(viewport.scrollLeft)).toBe(320);
    });
  });

  it('recalculates dynamic sticky extents on resize without jump', async () => {
    const gridRef = React.createRef<VirtualGridHandle>();

    const Scenario = () => {
      const [expanded, setExpanded] = React.useState(false);
      const topHeight = expanded ? 84 : 36;
      const leftWidth = expanded ? 150 : 80;

      return (
        <div>
          <button
            type='button'
            data-testid='toggle-grid-sticky'
            onClick={() => setExpanded((prev) => !prev)}
          >
            toggle grid sticky
          </button>
          <VirtualGrid
            ref={gridRef}
            rowCount={200}
            columnCount={200}
            rows={{ sizeMode: 'dynamic', estimatedItemSize: 30 }}
            columns={{ sizeMode: 'dynamic', estimatedItemSize: 80 }}
            overscan={0}
            sticky={{
              top: 1,
              left: 1,
              renderTopStickyRow: ({ rowIndex }) => (
                <div
                  data-testid={`sticky-top-${rowIndex}`}
                  style={{ height: topHeight }}
                >
                  top
                </div>
              ),
              renderLeftStickyColumn: ({ columnIndex }) => (
                <div
                  data-testid={`sticky-left-${columnIndex}`}
                  style={{ width: leftWidth, height: '100%' }}
                >
                  left
                </div>
              ),
            }}
            renderCell={({ rowIndex, columnIndex }) => <div data-testid={`cell-${rowIndex}-${columnIndex}`} />}
            style={viewportStyle}
            className={gridViewportClass}
          />
        </div>
      );
    };

    const { container, getByTestId } = render(<Scenario />);
    const viewport = getViewport(container, gridViewportClass);

    act(() => {
      viewport.scrollTop = 460;
      viewport.scrollLeft = 540;
      fireEvent.scroll(viewport);
    });

    await waitForPaint();
    const beforeTop = viewport.scrollTop;
    const beforeLeft = viewport.scrollLeft;

    act(() => {
      fireEvent.click(getByTestId('toggle-grid-sticky'));
    });

    await waitForPaint();
    act(() => {
      gridRef.current?.measure();
    });

    await waitFor(() => {
      expect(Math.round(viewport.scrollTop)).toBe(Math.round(beforeTop));
      expect(Math.round(viewport.scrollLeft)).toBe(Math.round(beforeLeft));
    });
  });

  it('scrolls to cell by imperative handle', async () => {
    const gridRef = React.createRef<VirtualGridHandle>();
    const { container } = render(
      <VirtualGrid
        ref={gridRef}
        rowCount={120}
        columnCount={120}
        rows={{ sizeMode: 'fixed', itemSize: 30 }}
        columns={{ sizeMode: 'fixed', itemSize: 40 }}
        overscan={0}
        renderCell={({ rowIndex, columnIndex }) => <div>{`${rowIndex}-${columnIndex}`}</div>}
        style={viewportStyle}
        className={gridViewportClass}
      />,
    );

    const viewport = getViewport(container, gridViewportClass);
    act(() => {
      gridRef.current?.scrollToCell(15, 12);
    });

    await waitFor(() => {
      expect(viewport.scrollTop).toBe(450);
      expect(viewport.scrollLeft).toBe(480);
    });
  });
});
