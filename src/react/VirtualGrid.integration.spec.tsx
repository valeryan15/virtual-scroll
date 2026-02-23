import React from 'react';
import { act, render } from '@testing-library/react';
import { VirtualGrid } from './VirtualGrid';
import type { VirtualGridHandle } from './types';

type ResizeEntry = {
  target: Element;
  contentRect: { width: number; height: number };
};

const observerRegistry = new Map<Element, { callback: (entries: ResizeEntry[]) => void }>();

class MockResizeObserver {
  private readonly callback: (entries: ResizeEntry[]) => void;

  constructor(callback: (entries: ResizeEntry[]) => void) {
    this.callback = callback;
  }

  observe(element: Element) {
    observerRegistry.set(element, { callback: this.callback });
  }

  unobserve(element: Element) {
    observerRegistry.delete(element);
  }

  disconnect() {
    observerRegistry.clear();
  }
}

const triggerResize = (element: Element, size: { width: number; height: number }) => {
  const registered = observerRegistry.get(element);
  if (!registered) {
    return;
  }
  registered.callback([{ target: element, contentRect: size }]);
};

const setClientSize = (element: HTMLElement, size: { width: number; height: number }) => {
  Object.defineProperty(element, 'clientWidth', { value: size.width, configurable: true });
  Object.defineProperty(element, 'clientHeight', { value: size.height, configurable: true });
};

type ScrollToOptions = { top?: number; left?: number; behavior?: ScrollBehavior };

const setupViewport = (element: HTMLElement) => {
  element.scrollTop = 0;
  element.scrollLeft = 0;
  element.scrollTo = (options?: ScrollToOptions | number, y?: number) => {
    if (typeof options === 'number') {
      element.scrollLeft = options;
      if (typeof y === 'number') {
        element.scrollTop = y;
      }
      return;
    }

    if (typeof options?.top === 'number') {
      element.scrollTop = options.top;
    }
    if (typeof options?.left === 'number') {
      element.scrollLeft = options.left;
    }
  };
};

beforeEach(() => {
  observerRegistry.clear();
  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  };
  global.cancelAnimationFrame = () => undefined;
});

afterEach(() => {
  observerRegistry.clear();
});

describe('VirtualGrid integration', () => {
  const flushEffects = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('renders sticky layers aligned to fixed sizes', async () => {
    const { container, getByTestId } = render(
      <VirtualGrid
        rowCount={3}
        columnCount={3}
        rows={{ sizeMode: 'fixed', itemSize: 20 }}
        columns={{ sizeMode: 'fixed', itemSize: 30 }}
        overscan={0}
        renderCell={({ rowIndex, columnIndex }) => <div data-testid={`cell-${rowIndex}-${columnIndex}`} />}
        sticky={{
          top: 1,
          left: 1,
          renderTopStickyRow: ({ rowIndex }) => <div data-testid={`sticky-top-${rowIndex}`} />,
          renderLeftStickyColumn: ({ columnIndex }) => <div data-testid={`sticky-left-${columnIndex}`} />,
          renderCorner: ({ corner }) => <div data-testid={`sticky-corner-${corner}`} />,
        }}
      />,
    );

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 120, height: 60 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 120, height: 60 });
    });

    const bodyLayer = container.querySelector('[data-virtual-layer="body"]') as HTMLElement;
    expect(bodyLayer?.style.height).toBe('60px');
    expect(bodyLayer?.style.width).toBe('90px');
    expect(bodyLayer?.style.paddingTop).toBe('');
    expect(bodyLayer?.style.paddingLeft).toBe('');

    const firstBodyCell = getByTestId('cell-1-1').parentElement as HTMLElement;
    const initialTop = firstBodyCell.style.top;
    const initialLeft = firstBodyCell.style.left;

    expect(getByTestId('sticky-top-0')).toBeTruthy();
    expect(getByTestId('sticky-left-0')).toBeTruthy();
    expect(getByTestId('sticky-corner-tl')).toBeTruthy();

    const topWrapper = getByTestId('sticky-top-0').parentElement?.parentElement;
    const leftWrapper = getByTestId('sticky-left-0').parentElement?.parentElement;
    expect(topWrapper?.style.height).toBe('20px');
    expect(leftWrapper?.style.width).toBe('30px');
  });

  it('updates rendered cells on scroll', async () => {
    const gridRef = React.createRef<VirtualGridHandle>();
    const { container, queryByTestId } = render(
      <VirtualGrid
        ref={gridRef}
        rowCount={6}
        columnCount={6}
        rows={{ sizeMode: 'fixed', itemSize: 20 }}
        columns={{ sizeMode: 'fixed', itemSize: 30 }}
        overscan={0}
        renderCell={({ rowIndex, columnIndex }) => <div data-testid={`cell-${rowIndex}-${columnIndex}`} />}
      />,
    );

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 90, height: 40 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 90, height: 40 });
    });

    expect(queryByTestId('cell-0-0')).toBeTruthy();
    expect(queryByTestId('cell-4-4')).toBeFalsy();

    await act(async () => {
      viewport.scrollTop = 40;
      viewport.scrollLeft = 60;
      gridRef.current?.measure();
      await Promise.resolve();
    });

    expect(queryByTestId('cell-0-0')).toBeFalsy();
    expect(queryByTestId('cell-4-4')).toBeTruthy();
  });

  it('does not loop when controlled scroll updates state', async () => {
    const ControlledGrid = () => {
      const [position, setPosition] = React.useState({ top: 0, left: 0 });

      return (
        <VirtualGrid
          rowCount={20}
          columnCount={20}
          rows={{ sizeMode: 'fixed', itemSize: 20 }}
          columns={{ sizeMode: 'fixed', itemSize: 30 }}
          overscan={0}
          renderCell={({ rowIndex, columnIndex }) => <div data-testid={`cell-${rowIndex}-${columnIndex}`} />}
          scroll={{
            position,
            onScroll: (next) => setPosition(next),
          }}
        />
      );
    };

    const { container } = render(<ControlledGrid />);
    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 90, height: 60 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 90, height: 60 });
    });

    await act(async () => {
      viewport.scrollTop = 40;
      viewport.scrollLeft = 60;
      viewport.dispatchEvent(new Event('scroll'));
      await Promise.resolve();
    });

    expect(viewport.scrollTop).toBe(40);
    expect(viewport.scrollLeft).toBe(60);
  });

  it('syncs sticky layers with scroll offsets', async () => {
    const baseProps = {
      rowCount: 4,
      columnCount: 4,
      rows: { sizeMode: 'fixed' as const, itemSize: 20 },
      columns: { sizeMode: 'fixed' as const, itemSize: 30 },
      overscan: 0,
      renderCell: ({ rowIndex, columnIndex }: { rowIndex: number; columnIndex: number }) => (
        <div data-testid={`cell-${rowIndex}-${columnIndex}`} />
      ),
      sticky: {
        top: 1,
        left: 1,
        renderTopStickyRow: ({ rowIndex }: { rowIndex: number }) => <div data-testid={`sticky-top-${rowIndex}`} />,
        renderLeftStickyColumn: ({ columnIndex }: { columnIndex: number }) => (
          <div data-testid={`sticky-left-${columnIndex}`} />
        ),
      },
    };

    const { container, getByTestId } = render(<VirtualGrid {...baseProps} />);

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 120, height: 60 });
    viewport.scrollLeft = 30;
    viewport.scrollTop = 40;
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 120, height: 60 });
    });

    await act(async () => {
      viewport.dispatchEvent(new Event('scroll'));
      await Promise.resolve();
    });

    await flushEffects();

    const topWrapper = getByTestId('sticky-top-0').parentElement?.parentElement;
    const leftWrapper = getByTestId('sticky-left-0').parentElement?.parentElement;
    expect(topWrapper?.parentElement?.style.transform).toBe('translate3d(30px, 40px, 0)');
    expect(leftWrapper?.parentElement?.style.transform).toBe('translate3d(30px, 40px, 0)');
  });

  it('renders bottom/right sticky zones in correct order', async () => {
    const { container, getByTestId } = render(
      <VirtualGrid
        rowCount={4}
        columnCount={4}
        rows={{ sizeMode: 'fixed', itemSize: 10 }}
        columns={{ sizeMode: 'fixed', itemSize: 15 }}
        overscan={0}
        renderCell={({ rowIndex, columnIndex }) => <div data-testid={`cell-${rowIndex}-${columnIndex}`} />}
        sticky={{
          bottom: 2,
          right: 2,
          renderBottomStickyRow: ({ rowIndex }) => <div data-testid={`sticky-bottom-${rowIndex}`} />,
          renderRightStickyColumn: ({ columnIndex }) => <div data-testid={`sticky-right-${columnIndex}`} />,
        }}
      />,
    );

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 120, height: 60 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 120, height: 60 });
    });

    const bottomLastWrapper = getByTestId('sticky-bottom-3').parentElement?.parentElement;
    const bottomPrevWrapper = getByTestId('sticky-bottom-2').parentElement?.parentElement;
    expect(bottomLastWrapper?.style.bottom).toBe('0px');
    expect(bottomPrevWrapper?.style.bottom).toBe('10px');

    const rightLastWrapper = getByTestId('sticky-right-3').parentElement?.parentElement;
    const rightPrevWrapper = getByTestId('sticky-right-2').parentElement?.parentElement;
    expect(rightLastWrapper?.style.right).toBe('0px');
    expect(rightPrevWrapper?.style.right).toBe('15px');
  });

  it('updates dynamic sticky row and column extents from measurements', async () => {
    let topHeight = 20;
    let leftWidth = 30;

    const renderGrid = () => (
      <VirtualGrid
        rowCount={6}
        columnCount={6}
        rows={{ sizeMode: 'dynamic', estimatedItemSize: 20 }}
        columns={{ sizeMode: 'dynamic', estimatedItemSize: 30 }}
        overscan={0}
        renderCell={({ rowIndex, columnIndex }) => <div data-testid={`cell-${rowIndex}-${columnIndex}`} />}
        sticky={{
          top: 1,
          left: 1,
          renderTopStickyRow: ({ rowIndex }) => (
            <div
              data-testid={`sticky-top-${rowIndex}`}
              style={{ height: topHeight }}
            />
          ),
          renderLeftStickyColumn: ({ columnIndex }) => (
            <div
              data-testid={`sticky-left-${columnIndex}`}
              style={{ width: leftWidth }}
            />
          ),
        }}
      />
    );

    const { container, getByTestId, rerender } = render(renderGrid());

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 180, height: 140 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 180, height: 140 });
    });

    await act(async () => {
      viewport.scrollTop = 80;
      viewport.scrollLeft = 90;
      viewport.dispatchEvent(new Event('scroll'));
      await Promise.resolve();
    });

    const trackedBodyCell = getByTestId('cell-4-3').parentElement as HTMLElement;
    const initialTop = trackedBodyCell.style.top;
    const initialLeft = trackedBodyCell.style.left;

    topHeight = 40;
    leftWidth = 50;
    rerender(renderGrid());

    const topWrapper = getByTestId('sticky-top-0').parentElement?.parentElement as HTMLElement;
    const leftWrapper = getByTestId('sticky-left-0').parentElement?.parentElement as HTMLElement;
    act(() => {
      triggerResize(topWrapper, { width: 180, height: topHeight });
      triggerResize(leftWrapper, { width: leftWidth, height: 140 });
    });

    await flushEffects();

    const updatedTrackedBodyCell = getByTestId('cell-4-3').parentElement as HTMLElement;
    expect(updatedTrackedBodyCell.style.top).toBe('100px');
    expect(updatedTrackedBodyCell.style.left).toBe('110px');
    expect(updatedTrackedBodyCell.style.top).not.toBe(initialTop);
    expect(updatedTrackedBodyCell.style.left).not.toBe(initialLeft);
    expect(viewport.scrollTop).toBe(80);
    expect(viewport.scrollLeft).toBe(90);
  });

  it('skips dynamic scroll when allowEstimate is false', async () => {
    const gridRef = React.createRef<VirtualGridHandle>();
    const { container } = render(
      <VirtualGrid
        ref={gridRef}
        rowCount={20}
        columnCount={20}
        rows={{ sizeMode: 'dynamic', estimatedItemSize: 20 }}
        columns={{ sizeMode: 'dynamic', estimatedItemSize: 30 }}
        overscan={0}
        renderCell={({ rowIndex, columnIndex }) => <div data-testid={`cell-${rowIndex}-${columnIndex}`} />}
      />,
    );

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 90, height: 60 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 90, height: 60 });
    });

    act(() => {
      gridRef.current?.scrollToCell(10, 10, { allowEstimate: false });
    });

    expect(viewport.scrollTop).toBe(0);
    expect(viewport.scrollLeft).toBe(0);
  });

  it('scrolls to cell via imperative handle and clamps out-of-range values', async () => {
    const gridRef = React.createRef<VirtualGridHandle>();
    const { container } = render(
      <VirtualGrid
        ref={gridRef}
        rowCount={10}
        columnCount={10}
        rows={{ sizeMode: 'fixed', itemSize: 20 }}
        columns={{ sizeMode: 'fixed', itemSize: 30 }}
        overscan={0}
        renderCell={({ rowIndex, columnIndex }) => <div data-testid={`cell-${rowIndex}-${columnIndex}`} />}
      />,
    );

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 90, height: 60 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 90, height: 60 });
    });

    act(() => {
      gridRef.current?.scrollToCell(4, 5);
    });
    expect(viewport.scrollTop).toBe(80);
    expect(viewport.scrollLeft).toBe(150);

    act(() => {
      gridRef.current?.scrollToCell(-10, -20);
    });
    expect(viewport.scrollTop).toBe(0);
    expect(viewport.scrollLeft).toBe(0);

    act(() => {
      gridRef.current?.scrollToCell(100, 100);
    });
    expect(viewport.scrollTop).toBe(140);
    expect(viewport.scrollLeft).toBe(210);
  });
});
