import React from 'react';
import { act, render } from '@testing-library/react';
import { VirtualList } from './VirtualList';
import type { VirtualListHandle } from './types';

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

describe('VirtualList integration', () => {
  const flushEffects = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('renders visible window and updates on scroll', async () => {
    const items = Array.from({ length: 10 }, (_, index) => `Item ${index}`);
    const listRef = React.createRef<VirtualListHandle>();
    const { container, getByTestId, queryByTestId } = render(
      <VirtualList
        ref={listRef}
        items={items}
        itemKey={(item) => item}
        renderItem={({ index }) => <div data-testid={`item-${index}`} />}
        layout={{ sizeMode: 'fixed', itemSize: 20 }}
        overscan={0}
      />,
    );

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 200, height: 60 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 200, height: 60 });
    });

    expect(queryByTestId('item-0')).toBeTruthy();
    expect(queryByTestId('item-2')).toBeTruthy();
    expect(queryByTestId('item-4')).toBeFalsy();

    await act(async () => {
      viewport.scrollTop = 40;
      listRef.current?.measure();
      await Promise.resolve();
    });

    expect(queryByTestId('item-0')).toBeFalsy();
    expect(queryByTestId('item-2')).toBeTruthy();
    expect(queryByTestId('item-5')).toBeTruthy();
  });

  it('does not loop when controlled scroll updates state', async () => {
    const ControlledList = () => {
      const [position, setPosition] = React.useState({ top: 0, left: 0 });

      return (
        <VirtualList
          items={Array.from({ length: 20 }, (_, index) => ({ id: index }))}
          itemKey={(item) => item.id}
          renderItem={({ item }) => <div data-testid={`item-${item.id}`} />}
          layout={{ sizeMode: 'fixed', itemSize: 20 }}
          overscan={0}
          scroll={{
            position,
            onScroll: (next) => setPosition(next),
          }}
        />
      );
    };

    const { container } = render(<ControlledList />);
    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 200, height: 60 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 200, height: 60 });
    });

    await act(async () => {
      viewport.scrollTop = 40;
      viewport.dispatchEvent(new Event('scroll'));
      await Promise.resolve();
    });

    expect(viewport.scrollTop).toBe(40);
  });

  it('renders sticky top and bottom slices', async () => {
    const items = ['Alpha', 'Beta', 'Gamma'];
    const { container, getByTestId } = render(
      <VirtualList
        items={items}
        itemKey={(item) => item}
        renderItem={({ item }) => <div>{item}</div>}
        layout={{ sizeMode: 'fixed', itemSize: 20 }}
        overscan={0}
        sticky={{
          top: 1,
          bottom: 1,
          renderStickyTop: ({ items: stickyItems }) => <div data-testid='sticky-top'>{stickyItems.join(',')}</div>,
          renderStickyBottom: ({ items: stickyItems }) => (
            <div data-testid='sticky-bottom'>{stickyItems.join(',')}</div>
          ),
        }}
      />,
    );

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 200, height: 40 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 200, height: 40 });
    });

    const bodyLayer = container.querySelector('[data-virtual-layer="body"]') as HTMLElement;
    expect(bodyLayer?.style.height).toBe('60px');
    expect(bodyLayer?.style.paddingTop).toBe('');
    expect(bodyLayer?.style.paddingBottom).toBe('');
    expect(getByTestId('sticky-top').textContent).toBe('Alpha');
    expect(getByTestId('sticky-bottom').textContent).toBe('Gamma');
  });

  it('keeps the last body item visible at the end with sticky top and bottom', async () => {
    const items = Array.from({ length: 200 }, (_, index) => `Item ${index + 1}`);
    const listRef = React.createRef<VirtualListHandle>();
    const { container, getByTestId, queryByTestId } = render(
      <VirtualList
        ref={listRef}
        items={items}
        itemKey={(item) => item}
        renderItem={({ index }) => <div data-testid={`item-${index}`} />}
        layout={{ sizeMode: 'fixed', itemSize: 36 }}
        overscan={0}
        sticky={{
          top: 1,
          bottom: 1,
          renderStickyTop: ({ items: stickyItems }) => <div>{stickyItems[0]}</div>,
          renderStickyBottom: ({ items: stickyItems }) => <div>{stickyItems[0]}</div>,
        }}
      />,
    );

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 320, height: 360 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 320, height: 360 });
    });

    const firstBodyItem = getByTestId('item-1').parentElement as HTMLElement;
    expect(firstBodyItem.style.top).toBe('36px');

    await act(async () => {
      listRef.current?.scrollToIndex(198, { align: 'end' });
      listRef.current?.measure();
      await Promise.resolve();
    });

    expect(queryByTestId('item-197')).toBeTruthy();
    expect(queryByTestId('item-198')).toBeTruthy();
  });

  it('updates dynamic sticky extents from measured layer sizes', async () => {
    const listRef = React.createRef<VirtualListHandle>();
    let topHeight = 20;
    let bottomHeight = 20;
    const items = Array.from({ length: 6 }, (_, index) => `Item ${index}`);

    const renderList = () => (
      <VirtualList
        ref={listRef}
        items={items}
        itemKey={(item) => item}
        renderItem={({ index }) => <div data-testid={`item-${index}`} />}
        layout={{ sizeMode: 'dynamic', estimatedItemSize: 20 }}
        overscan={0}
        sticky={{
          top: 1,
          bottom: 1,
          renderStickyTop: () => (
            <div
              data-testid='sticky-top-content'
              style={{ height: `${topHeight}px` }}
            />
          ),
          renderStickyBottom: () => (
            <div
              data-testid='sticky-bottom-content'
              style={{ height: `${bottomHeight}px` }}
            />
          ),
        }}
      />
    );

    const { container, getByTestId, rerender } = render(renderList());
    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 200, height: 120 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 200, height: 120 });
    });

    expect((getByTestId('item-1').parentElement as HTMLElement).style.top).toBe('20px');

    await act(async () => {
      viewport.scrollTop = 50;
      viewport.dispatchEvent(new Event('scroll'));
      await Promise.resolve();
    });

    topHeight = 40;
    bottomHeight = 30;
    rerender(renderList());

    const stickyTopLayerContent = container.querySelector('[data-virtual-layer="sticky-top"] > div') as HTMLElement;
    const stickyBottomLayerContent = container.querySelector(
      '[data-virtual-layer="sticky-bottom"] > div',
    ) as HTMLElement;

    act(() => {
      triggerResize(stickyTopLayerContent, { width: 200, height: topHeight });
      triggerResize(stickyBottomLayerContent, { width: 200, height: bottomHeight });
    });

    await flushEffects();

    const bodyLayer = container.querySelector('[data-virtual-layer="body"]') as HTMLElement;
    expect((getByTestId('item-2').parentElement as HTMLElement).style.top).toBe('60px');
    expect(bodyLayer.style.height).toBe('150px');
    expect(viewport.scrollTop).toBe(50);
  });

  it('scrolls to index via imperative handle and clamps out-of-range values', async () => {
    const items = Array.from({ length: 10 }, (_, index) => `Item ${index}`);
    const listRef = React.createRef<VirtualListHandle>();
    const { container } = render(
      <VirtualList
        ref={listRef}
        items={items}
        itemKey={(item) => item}
        renderItem={({ index }) => <div data-testid={`item-${index}`} />}
        layout={{ sizeMode: 'fixed', itemSize: 20 }}
        overscan={0}
      />,
    );

    const viewport = container.firstElementChild as HTMLElement;
    setupViewport(viewport);
    setClientSize(viewport, { width: 200, height: 60 });
    await flushEffects();

    act(() => {
      triggerResize(viewport, { width: 200, height: 60 });
    });

    act(() => {
      listRef.current?.scrollToIndex(4);
    });
    expect(viewport.scrollTop).toBe(80);

    act(() => {
      listRef.current?.scrollToIndex(-10);
    });
    expect(viewport.scrollTop).toBe(0);

    act(() => {
      listRef.current?.scrollToIndex(100);
    });
    expect(viewport.scrollTop).toBe(140);
  });
});
