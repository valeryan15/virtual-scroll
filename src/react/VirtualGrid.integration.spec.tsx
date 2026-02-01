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
        renderCell={({ rowIndex, columnIndex }) => (
          <div data-testid={`cell-${rowIndex}-${columnIndex}`} />
        )}
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
        renderCell={({ rowIndex, columnIndex }) => (
          <div data-testid={`cell-${rowIndex}-${columnIndex}`} />
        )}
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
});
