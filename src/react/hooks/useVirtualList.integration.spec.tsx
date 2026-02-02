import React, { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { useVirtualList } from './useVirtualList';

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

type TestListProps = {
  count: number;
  estimatedItemSize: number;
  onResult?: (result: ReturnType<typeof useVirtualList>) => void;
};

const TestList = ({ count, estimatedItemSize, onResult }: TestListProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const result = useVirtualList({
    count,
    viewportRef: viewportRef as RefObject<HTMLElement>,
    sizeMode: 'dynamic',
    estimatedItemSize,
    overscan: 1,
  });

  useEffect(() => {
    onResult?.(result);
  }, [onResult, result]);

  return (
    <div ref={viewportRef} data-testid="viewport">
      <div style={{ position: 'relative', height: result.totalSize }}>
        {result.items.map((item) => (
          <div
            key={item.key}
            data-testid={`item-${item.index}`}
            data-size={item.size}
            style={{ position: 'absolute', top: item.offset, height: item.size }}
            ref={(element) => result.measureElement?.(item.index, element)}
          />
        ))}
      </div>
    </div>
  );
};

describe('useVirtualList integration', () => {
  const flushEffects = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('updates sizes after late measurement', async () => {
    const { getByTestId } = render(<TestList count={3} estimatedItemSize={10} />);
    const viewport = getByTestId('viewport') as HTMLDivElement;

    setupViewport(viewport);
    setClientSize(viewport, { width: 200, height: 50 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 200, height: 50 });
    });

    const item = getByTestId('item-0');
    expect(observerRegistry.has(item)).toBe(true);
    expect(item.getAttribute('data-size')).toBe('10');

    act(() => {
      triggerResize(item, { width: 200, height: 30 });
    });

    expect(getByTestId('item-0').getAttribute('data-size')).toBe('30');
  });

  it('keeps scroll position when prepend happens at the top', async () => {
    const { getByTestId } = render(<TestList count={10} estimatedItemSize={10} />);
    const viewport = getByTestId('viewport') as HTMLDivElement;

    setupViewport(viewport);
    setClientSize(viewport, { width: 200, height: 50 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 200, height: 50 });
    });

    viewport.scrollTop = 0;
    await act(async () => {
      fireEvent.scroll(viewport);
      await Promise.resolve();
    });
    await flushEffects();

    expect(viewport.scrollTop).toBe(0);
    const item = getByTestId('item-0');
    act(() => {
      triggerResize(item, { width: 200, height: 30 });
    });

    expect(viewport.scrollTop).toBe(0);
  });

  it('scrolls to index in dynamic mode', async () => {
    let latest: ReturnType<typeof useVirtualList> | null = null;
    const { getByTestId } = render(
      <TestList count={10} estimatedItemSize={10} onResult={(result) => (latest = result)} />,
    );
    const viewport = getByTestId('viewport') as HTMLDivElement;

    setupViewport(viewport);
    setClientSize(viewport, { width: 200, height: 50 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 200, height: 50 });
    });

    act(() => {
      latest?.scrollToIndex(4);
    });

    expect(viewport.scrollTop).toBe(40);
  });

  it('skips scroll when allowEstimate is false and target is outside range', async () => {
    let latest: ReturnType<typeof useVirtualList> | null = null;
    const { getByTestId } = render(
      <TestList count={20} estimatedItemSize={10} onResult={(result) => (latest = result)} />,
    );
    const viewport = getByTestId('viewport') as HTMLDivElement;

    setupViewport(viewport);
    setClientSize(viewport, { width: 200, height: 50 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 200, height: 50 });
    });

    act(() => {
      latest?.scrollToIndex(12, { allowEstimate: false });
    });

    expect(viewport.scrollTop).toBe(0);
  });
});
