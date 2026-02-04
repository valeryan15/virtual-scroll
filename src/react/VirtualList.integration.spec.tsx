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
    const { container, queryByTestId } = render(
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
          renderStickyTop: ({ items: stickyItems }) => (
            <div data-testid="sticky-top">{stickyItems.join(',')}</div>
          ),
          renderStickyBottom: ({ items: stickyItems }) => (
            <div data-testid="sticky-bottom">{stickyItems.join(',')}</div>
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
    expect(bodyLayer?.style.paddingTop).toBe('20px');
    expect(bodyLayer?.style.paddingBottom).toBe('0px');
    expect(getByTestId('sticky-top').textContent).toBe('Alpha');
    expect(getByTestId('sticky-bottom').textContent).toBe('Gamma');
  });
});
