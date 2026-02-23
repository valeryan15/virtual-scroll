import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MutableRefObject, Ref, RefObject, ReactElement } from 'react';
import { useResizeObserver } from './hooks/useResizeObserver';
import { useScrollPosition } from './hooks/useScrollPosition';
import { useVirtualList } from './hooks/useVirtualList';
import { StickyListLayer } from './internal/layers/StickyListLayer';
import { VirtualBodyLayer } from './internal/layers/VirtualBodyLayer';
import type { VirtualListHandle, VirtualListProps } from './types';

const assignRef = (target: RefObject<HTMLElement | null> | undefined, value: HTMLElement | null) => {
  if (target) {
    (target as MutableRefObject<HTMLElement | null>).current = value;
  }
};

const getStickySlice = <T,>(items: readonly T[], count: number, fromEnd: boolean) => {
  if (count <= 0) {
    return [];
  }
  if (fromEnd) {
    return items.slice(Math.max(0, items.length - count));
  }
  return items.slice(0, count);
};

function VirtualListInner<T>(props: VirtualListProps<T>, ref: Ref<VirtualListHandle>) {
  const { items, itemKey, renderItem, layout, overscan, sticky, ssr, scroll, onRangeChange, className, style } = props;
  const direction = layout?.direction ?? 'vertical';
  const sizeMode = layout?.sizeMode ?? 'fixed';
  const itemSize = layout?.itemSize;
  const estimatedItemSize = layout?.estimatedItemSize;
  const isVertical = direction === 'vertical';

  const internalRef = useRef<HTMLElement | null>(null);
  const viewportRef = (scroll?.containerRef ?? internalRef) as RefObject<HTMLElement | null>;
  const setViewportRef = useCallback(
    (node: HTMLElement | null) => {
      internalRef.current = node;
      assignRef(scroll?.containerRef, node);
    },
    [scroll?.containerRef],
  );

  const renderStickyTop = isVertical ? sticky?.renderStickyTop : undefined;
  const renderStickyBottom = isVertical ? sticky?.renderStickyBottom : undefined;
  // Sticky-срезы задаются количеством элементов от начала/конца массива.
  // Ограничиваем значения общей длиной, чтобы избежать пересечений и отрицательных диапазонов.
  const maxTopCount = Math.min(sticky?.top ?? 0, items.length);
  const topCount = renderStickyTop ? maxTopCount : 0;
  const maxBottomCount = Math.min(sticky?.bottom ?? 0, items.length - topCount);
  const bottomCount = renderStickyBottom ? maxBottomCount : 0;
  const bodyCount = Math.max(0, items.length - topCount - bottomCount);
  const ssrBodyCount = Math.max(0, Math.min(bodyCount, (ssr?.count ?? 0) - topCount));
  const itemExtent = sizeMode === 'fixed' ? (itemSize ?? 0) : (estimatedItemSize ?? 0);
  const estimatedStickyTopSize = isVertical ? topCount * itemExtent : 0;
  const estimatedStickyBottomSize = isVertical ? bottomCount * itemExtent : 0;
  const [measuredStickySize, setMeasuredStickySize] = useState({
    top: estimatedStickyTopSize,
    bottom: estimatedStickyBottomSize,
  });
  const stickyTopContentRef = useRef<HTMLDivElement | null>(null);
  const stickyBottomContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMeasuredStickySize({
      top: estimatedStickyTopSize,
      bottom: estimatedStickyBottomSize,
    });
  }, [estimatedStickyBottomSize, estimatedStickyTopSize]);

  const updateStickySize = useCallback((position: 'top' | 'bottom', nextValue: number) => {
    const normalizedValue = Math.max(0, nextValue);
    setMeasuredStickySize((current) => {
      const currentValue = current[position];
      if (Math.abs(currentValue - normalizedValue) <= 0.5) {
        return current;
      }
      return { ...current, [position]: normalizedValue };
    });
  }, []);

  const setStickyTopContentRef = useCallback(
    (element: HTMLDivElement | null) => {
      stickyTopContentRef.current = element;
      if (element) {
        updateStickySize('top', element.getBoundingClientRect().height);
      }
    },
    [updateStickySize],
  );

  const setStickyBottomContentRef = useCallback(
    (element: HTMLDivElement | null) => {
      stickyBottomContentRef.current = element;
      if (element) {
        updateStickySize('bottom', element.getBoundingClientRect().height);
      }
    },
    [updateStickySize],
  );

  useResizeObserver(stickyTopContentRef, (entry) => {
    updateStickySize('top', entry.contentRect.height);
  });

  useResizeObserver(stickyBottomContentRef, (entry) => {
    updateStickySize('bottom', entry.contentRect.height);
  });

  const stickyTopSize = isVertical && sizeMode === 'dynamic' ? measuredStickySize.top : estimatedStickyTopSize;
  const stickyBottomSize = isVertical && sizeMode === 'dynamic' ? measuredStickySize.bottom : estimatedStickyBottomSize;

  const {
    items: virtualItems,
    totalSize,
    scrollToIndex: scrollToBodyIndex,
    measureElement,
    range,
    measure,
  } = useVirtualList({
    count: bodyCount,
    itemKey: (index) => {
      const actualIndex = index + topCount;
      return itemKey(items[actualIndex], actualIndex);
    },
    viewportRef,
    direction,
    sizeMode,
    itemSize,
    estimatedItemSize,
    overscan,
    sticky: {
      top: topCount,
      bottom: bottomCount,
      topOffset: stickyTopSize,
      bottomOffset: stickyBottomSize,
    },
    ssr: ssrBodyCount > 0 ? { count: ssrBodyCount } : undefined,
    onRangeChange: (rangeValue) =>
      onRangeChange?.({
        items: { start: rangeValue.start + topCount, end: rangeValue.end + topCount },
      }),
  });

  const scrollPosition = useScrollPosition(viewportRef);
  const currentScrollTop = viewportRef.current?.scrollTop ?? scrollPosition.top;
  const onScrollRef = useRef(scroll?.onScroll);
  useEffect(() => {
    onScrollRef.current = scroll?.onScroll;
  }, [scroll?.onScroll]);
  useEffect(() => {
    onScrollRef.current?.(scrollPosition);
  }, [scrollPosition]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element || !scroll?.position) {
      return;
    }
    const { top, left } = scroll.position;
    if (typeof top === 'number' && element.scrollTop !== top) {
      element.scrollTop = top;
    }
    if (typeof left === 'number' && element.scrollLeft !== left) {
      element.scrollLeft = left;
    }
  }, [scroll?.position, viewportRef]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index, options) => {
        if (bodyCount <= 0) {
          return;
        }
        const bodyIndex = index - topCount;
        if (bodyIndex < 0) {
          scrollToBodyIndex(0, { ...options, align: 'start' });
          return;
        }
        if (bodyIndex >= bodyCount) {
          scrollToBodyIndex(bodyCount - 1, { ...options, align: 'end' });
          return;
        }
        scrollToBodyIndex(bodyIndex, options);
      },
      getScrollPosition: () => ({
        top: viewportRef.current?.scrollTop ?? 0,
        left: viewportRef.current?.scrollLeft ?? 0,
      }),
      getVisibleRange: () => ({ start: range.start + topCount, end: range.end + topCount }),
      measure,
    }),
    [bodyCount, measure, range.end, range.start, scrollToBodyIndex, topCount, viewportRef],
  );

  const viewportStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      overflow: 'auto',
      ...style,
    }),
    [style],
  );

  const contentStyle = useMemo<CSSProperties>(() => {
    if (direction === 'horizontal') {
      return { position: 'relative', width: totalSize, height: '100%' };
    }
    return {
      position: 'relative',
      height: totalSize + stickyTopSize + stickyBottomSize,
      width: '100%',
    };
  }, [direction, stickyBottomSize, stickyTopSize, totalSize]);

  const stickyTopItems = getStickySlice(items, topCount, false);
  const stickyBottomItems = getStickySlice(items, bottomCount, true);

  return (
    <div
      ref={setViewportRef}
      className={className}
      style={viewportStyle}
    >
      <VirtualBodyLayer style={contentStyle}>
        {virtualItems.map((virtualItem) => {
          const actualIndex = virtualItem.index + topCount;
          const itemStyle: CSSProperties =
            direction === 'horizontal'
              ? {
                  position: 'absolute',
                  left: virtualItem.offset,
                  ...(sizeMode === 'dynamic' ? { minWidth: virtualItem.size } : { width: virtualItem.size }),
                  height: '100%',
                }
              : {
                  position: 'absolute',
                  top: stickyTopSize + virtualItem.offset,
                  ...(sizeMode === 'dynamic' ? { minHeight: virtualItem.size } : { height: virtualItem.size }),
                  width: '100%',
                };

          return (
            <div
              key={virtualItem.key}
              style={itemStyle}
              ref={(element) => measureElement?.(virtualItem.index, element)}
            >
              {renderItem({ item: items[actualIndex], index: actualIndex })}
            </div>
          );
        })}
      </VirtualBodyLayer>
      {renderStickyTop && stickyTopItems.length > 0 && (
        <StickyListLayer
          position='top'
          size={sizeMode === 'dynamic' ? undefined : stickyTopSize}
          scrollOffsetX={viewportRef.current?.scrollLeft ?? scrollPosition.left}
          scrollOffsetY={currentScrollTop}
          contentRef={setStickyTopContentRef}
        >
          {renderStickyTop({ items: stickyTopItems })}
        </StickyListLayer>
      )}
      {renderStickyBottom && stickyBottomItems.length > 0 && (
        <StickyListLayer
          position='bottom'
          size={sizeMode === 'dynamic' ? undefined : stickyBottomSize}
          scrollOffsetX={viewportRef.current?.scrollLeft ?? scrollPosition.left}
          scrollOffsetY={currentScrollTop}
          contentRef={setStickyBottomContentRef}
        >
          {renderStickyBottom({ items: stickyBottomItems })}
        </StickyListLayer>
      )}
    </div>
  );
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: Ref<VirtualListHandle> },
) => ReactElement;
