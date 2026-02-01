import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { CSSProperties, MutableRefObject, Ref, RefObject, ReactElement } from 'react';
import { useScrollPosition } from './hooks/useScrollPosition';
import { useVirtualList } from './hooks/useVirtualList';
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
  const { items, itemKey, renderItem, layout, overscan, sticky, scroll, onRangeChange, className, style } = props;
  const direction = layout?.direction ?? 'vertical';
  const sizeMode = layout?.sizeMode ?? 'fixed';
  const itemSize = layout?.itemSize;
  const estimatedItemSize = layout?.estimatedItemSize;

  const internalRef = useRef<HTMLElement | null>(null);
  const viewportRef = (scroll?.containerRef ?? internalRef) as RefObject<HTMLElement | null>;
  const setViewportRef = useCallback(
    (node: HTMLElement | null) => {
      internalRef.current = node;
      assignRef(scroll?.containerRef, node);
    },
    [scroll?.containerRef],
  );

  const { items: virtualItems, totalSize, scrollToIndex, measureElement, range, measure } = useVirtualList({
    count: items.length,
    itemKey: (index) => itemKey(items[index], index),
    viewportRef,
    direction,
    sizeMode,
    itemSize,
    estimatedItemSize,
    overscan,
    sticky,
    onRangeChange: (rangeValue) => onRangeChange?.({ items: rangeValue }),
  });

  const scrollPosition = useScrollPosition(viewportRef);
  useEffect(() => {
    scroll?.onScroll?.(scrollPosition);
  }, [scroll, scrollPosition]);

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
      scrollToIndex,
      getScrollPosition: () => ({
        top: viewportRef.current?.scrollTop ?? 0,
        left: viewportRef.current?.scrollLeft ?? 0,
      }),
      getVisibleRange: () => ({ start: range.start, end: range.end }),
      measure,
    }),
    [measure, range.end, range.start, scrollToIndex, viewportRef],
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
    return { position: 'relative', height: totalSize, width: '100%' };
  }, [direction, totalSize]);

  const stickyTopItems = getStickySlice(items, sticky?.top ?? 0, false);
  const stickyBottomItems = getStickySlice(items, sticky?.bottom ?? 0, true);

  return (
    <div ref={setViewportRef} className={className} style={viewportStyle}>
      <div style={contentStyle}>
        {virtualItems.map((virtualItem) => {
          const itemStyle: CSSProperties =
            direction === 'horizontal'
              ? {
                  position: 'absolute',
                  left: virtualItem.offset,
                  width: virtualItem.size,
                  height: '100%',
                }
              : {
                  position: 'absolute',
                  top: virtualItem.offset,
                  height: virtualItem.size,
                  width: '100%',
                };

          return (
            <div
              key={virtualItem.key}
              style={itemStyle}
              ref={(element) => measureElement?.(virtualItem.index, element)}
            >
              {renderItem({ item: items[virtualItem.index], index: virtualItem.index })}
            </div>
          );
        })}
      </div>
      {sticky?.renderStickyTop && stickyTopItems.length > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
          {sticky.renderStickyTop({ items: stickyTopItems })}
        </div>
      )}
      {sticky?.renderStickyBottom && stickyBottomItems.length > 0 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }}>
          {sticky.renderStickyBottom({ items: stickyBottomItems })}
        </div>
      )}
    </div>
  );
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: Ref<VirtualListHandle> },
) => ReactElement;
