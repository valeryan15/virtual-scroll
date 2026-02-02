import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Key, RefObject } from 'react';
import { createAnchorManager } from '../../core/anchor/anchorManager';
import { createDynamicAxisModel } from '../../core/axis/dynamicAxis';
import { createFixedAxisModel } from '../../core/axis/fixedAxis';
import type { AxisModel } from '../../core/axis/axis.types';
import type { Overscan1D, ScrollToIndexOptions } from '../../shared/types';
import { useScrollPosition } from './useScrollPosition';
import { useViewportSize } from './useViewportSize';

type VirtualItem = {
  index: number;
  offset: number;
  size: number;
  key: Key;
};

type UseVirtualListArgs = {
  count: number;
  itemKey?: (index: number) => Key;
  viewportRef: RefObject<HTMLElement | null>;
  direction?: 'vertical' | 'horizontal';
  sizeMode: 'fixed' | 'dynamic';
  itemSize?: number;
  estimatedItemSize?: number;
  overscan?: Overscan1D;
  sticky?: { top?: number; bottom?: number };
  ssr?: { count?: number };
  onRangeChange?: (range: { start: number; end: number }) => void;
};

type UseVirtualListResult = {
  totalSize: number;
  items: VirtualItem[];
  offset: number;
  scrollToIndex: (index: number, options?: ScrollToIndexOptions) => void;
  measureElement?: (index: number, el: HTMLElement | null) => void;
  measure: () => void;
  range: { start: number; end: number };
};

const getOverscanValue = (overscan?: Overscan1D) => {
  if (typeof overscan === 'number') {
    return overscan;
  }

  if (overscan && typeof overscan === 'object') {
    return Math.max(overscan.before ?? 0, overscan.after ?? 0);
  }

  return undefined;
};

const getItemSizeFromAxis = (axis: AxisModel, index: number, fallback: number) => {
  if ('getSize' in axis && typeof axis.getSize === 'function') {
    return axis.getSize(index);
  }

  return fallback;
};

export function useVirtualList(args: UseVirtualListArgs): UseVirtualListResult {
  const {
    count,
    itemKey,
    viewportRef,
    direction = 'vertical',
    sizeMode,
    itemSize,
    estimatedItemSize,
    overscan,
    sticky,
    ssr,
    onRangeChange,
  } = args;
  const overscanValue = getOverscanValue(overscan);
  const anchorManager = useMemo(() => createAnchorManager(), []);
  const [measureVersion, setMeasureVersion] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const scrollPosition = useScrollPosition(viewportRef);
  const viewportSize = useViewportSize(viewportRef);
  const ssrCount = Math.max(0, Math.min(count, ssr?.count ?? 0));

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const axis = useMemo(() => {
    if (sizeMode === 'dynamic') {
      return createDynamicAxisModel({
        count,
        estimatedItemSize: estimatedItemSize ?? 0,
        overscan: overscanValue,
      });
    }

    return createFixedAxisModel({
      count,
      itemSize: itemSize ?? 0,
      overscan: overscanValue,
    });
  }, [count, estimatedItemSize, itemSize, overscanValue, sizeMode]);

  const axisRef = useRef(axis);
  axisRef.current = axis;

  const range = useMemo(() => {
    if (!isHydrated && ssrCount > 0) {
      return { start: 0, end: ssrCount, offset: 0 };
    }
    const stickyExtent = sizeMode === 'fixed' ? itemSize ?? 0 : estimatedItemSize ?? 0;
    const startOffset = direction === 'vertical' ? (sticky?.top ?? 0) * stickyExtent : 0;
    const endOffset = direction === 'vertical' ? (sticky?.bottom ?? 0) * stickyExtent : 0;
    const currentScrollOffset =
      direction === 'horizontal'
        ? viewportRef.current?.scrollLeft ?? scrollPosition.left
        : viewportRef.current?.scrollTop ?? scrollPosition.top;
    const viewportExtent = direction === 'horizontal' ? viewportSize.width : viewportSize.height;
    const effectiveScrollOffset = Math.max(0, currentScrollOffset - startOffset);
    const effectiveExtent = Math.max(0, viewportExtent - startOffset - endOffset);
    return axis.getRange(effectiveScrollOffset, effectiveExtent, overscanValue);
  }, [
    axis,
    direction,
    estimatedItemSize,
    itemSize,
    overscanValue,
    scrollPosition.left,
    scrollPosition.top,
    sticky?.bottom,
    sticky?.top,
    viewportRef,
    viewportSize.height,
    viewportSize.width,
    measureVersion,
    sizeMode,
    isHydrated,
    ssrCount,
  ]);

  const rangeRef = useRef(range);
  const scrollOffsetRef = useRef(0);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);
  useEffect(() => {
    scrollOffsetRef.current = direction === 'horizontal' ? scrollPosition.left : scrollPosition.top;
  }, [direction, scrollPosition.left, scrollPosition.top]);

  useEffect(() => {
    onRangeChange?.({ start: range.start, end: range.end });
  }, [onRangeChange, range.end, range.start]);

  const scrollToIndex = useCallback(
    (index: number, options?: ScrollToIndexOptions) => {
      const element = viewportRef.current;
      if (!element) {
        return;
      }

      if (sizeMode === 'dynamic' && options?.allowEstimate === false) {
        const currentRange = rangeRef.current;
        if (index < currentRange.start || index >= currentRange.end) {
          return;
        }
      }

      const axisModel = axisRef.current;
      const safeIndex = Math.min(Math.max(index, 0), axisModel.count - 1);
      const baseOffset = axisModel.getOffsetByIndex(safeIndex);
      const itemExtent = getItemSizeFromAxis(axisModel, safeIndex, itemSize ?? 0);
      const stickyExtent = sizeMode === 'fixed' ? itemSize ?? 0 : estimatedItemSize ?? 0;
      const startOffset = direction === 'vertical' ? (sticky?.top ?? 0) * stickyExtent : 0;
      const endOffset = direction === 'vertical' ? (sticky?.bottom ?? 0) * stickyExtent : 0;
      const viewportExtent = direction === 'horizontal' ? viewportSize.width : viewportSize.height;
      const effectiveExtent = Math.max(0, viewportExtent - startOffset - endOffset);
      const align = options?.align ?? 'start';
      let targetOffset = baseOffset;

      if (align === 'center') {
        targetOffset = baseOffset - (effectiveExtent - itemExtent) / 2;
      } else if (align === 'end') {
        targetOffset = baseOffset - (effectiveExtent - itemExtent);
      } else if (align === 'nearest') {
        const current = direction === 'horizontal' ? element.scrollLeft : element.scrollTop;
        const end = baseOffset + itemExtent;
        const effectiveCurrent = Math.max(0, current - startOffset);
        const viewportEnd = effectiveCurrent + effectiveExtent;
        if (baseOffset >= effectiveCurrent && end <= viewportEnd) {
          return;
        }
        targetOffset = baseOffset < effectiveCurrent ? baseOffset : end - effectiveExtent;
      }

      const finalOffset = Math.max(0, targetOffset + startOffset);
      if (direction === 'horizontal') {
        element.scrollTo({ left: finalOffset, behavior: options?.behavior });
      } else {
        element.scrollTo({ top: finalOffset, behavior: options?.behavior });
      }
    },
    [
      direction,
      estimatedItemSize,
      itemSize,
      sizeMode,
      sticky?.bottom,
      sticky?.top,
      viewportRef,
      viewportSize.height,
      viewportSize.width,
    ],
  );

  const measurementRef = useRef<{
    observer: ResizeObserver;
    observed: Map<HTMLElement, number>;
    pending: Map<number, number>;
    frame: number | null;
  } | null>(null);

  useEffect(() => {
    if (sizeMode !== 'dynamic' || typeof ResizeObserver === 'undefined') {
      measurementRef.current?.observer.disconnect();
      measurementRef.current = null;
      return;
    }

    const observed = new Map<HTMLElement, number>();
    const pending = new Map<number, number>();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const index = observed.get(entry.target as HTMLElement);
        if (index === undefined) {
          continue;
        }
        const size = Math.max(0, entry.contentRect.height);
        pending.set(index, size);
      }

      const state = measurementRef.current;
      if (!state || state.frame !== null) {
        return;
      }

      state.frame = requestAnimationFrame(() => {
        if (!measurementRef.current) {
          return;
        }
        measurementRef.current.frame = null;

        const axisModel = axisRef.current;
        if (!('setSize' in axisModel) || typeof axisModel.setSize !== 'function') {
          pending.clear();
          return;
        }

        const currentScrollOffset =
          direction === 'horizontal'
            ? viewportRef.current?.scrollLeft ?? scrollOffsetRef.current
            : viewportRef.current?.scrollTop ?? scrollOffsetRef.current;
        const stickyExtent = estimatedItemSize ?? 0;
        const startOffset = direction === 'vertical' ? (sticky?.top ?? 0) * stickyExtent : 0;
        const effectiveScrollOffset = Math.max(0, currentScrollOffset - startOffset);
        const anchor = anchorManager.capture({
          scrollOffset: effectiveScrollOffset,
          rangeStart: rangeRef.current.start,
          count: axisModel.count,
          getOffsetByIndex: axisModel.getOffsetByIndex,
        });

        for (const [index, size] of pending.entries()) {
          axisModel.setSize(index, size);
        }
        pending.clear();

        const element = viewportRef.current;
        if (element) {
          const nextOffset = anchorManager.apply(anchor, {
            count: axisModel.count,
            getOffsetByIndex: axisModel.getOffsetByIndex,
          });
          const finalOffset = nextOffset + startOffset;
          if (direction === 'horizontal') {
            if (Math.abs(element.scrollLeft - finalOffset) > 0.5) {
              element.scrollLeft = finalOffset;
            }
          } else if (Math.abs(element.scrollTop - finalOffset) > 0.5) {
            element.scrollTop = finalOffset;
          }
        }

        setMeasureVersion((value) => value + 1);
      });
    });

    measurementRef.current = {
      observer,
      observed,
      pending,
      frame: null,
    };

    return () => {
      const state = measurementRef.current;
      if (!state) {
        return;
      }
      if (state.frame !== null) {
        cancelAnimationFrame(state.frame);
      }
      state.observer.disconnect();
      measurementRef.current = null;
    };
  }, [anchorManager, direction, estimatedItemSize, itemSize, sizeMode, sticky?.top, viewportRef]);

  const measureElement = useCallback(
    (index: number, element: HTMLElement | null) => {
      const state = measurementRef.current;
      if (!state) {
        return;
      }

      if (!element) {
        for (const [node, storedIndex] of state.observed.entries()) {
          if (storedIndex === index) {
            state.observer.unobserve(node);
            state.observed.delete(node);
          }
        }
        return;
      }

      state.observed.set(element, index);
      state.observer.observe(element);
    },
    [],
  );

  const items = useMemo(() => {
    const result: VirtualItem[] = [];
    for (let index = range.start; index < range.end; index += 1) {
      const offset = axis.getOffsetByIndex(index);
      const size = getItemSizeFromAxis(axis, index, itemSize ?? 0);
      result.push({
        index,
        offset,
        size,
        key: itemKey ? itemKey(index) : index,
      });
    }
    return result;
  }, [axis, itemKey, itemSize, measureVersion, range.end, range.start]);

  const measure = useCallback(() => {
    const axisModel = axisRef.current;
    if (sizeMode !== 'dynamic') {
      setMeasureVersion((value) => value + 1);
      return;
    }

    const state = measurementRef.current;
    if (!state || !('setSize' in axisModel) || typeof axisModel.setSize !== 'function') {
      setMeasureVersion((value) => value + 1);
      return;
    }

    const currentScrollOffset =
      direction === 'horizontal'
        ? viewportRef.current?.scrollLeft ?? scrollOffsetRef.current
        : viewportRef.current?.scrollTop ?? scrollOffsetRef.current;
    const stickyExtent = estimatedItemSize ?? 0;
    const startOffset = direction === 'vertical' ? (sticky?.top ?? 0) * stickyExtent : 0;
    const effectiveScrollOffset = Math.max(0, currentScrollOffset - startOffset);
    const anchor = anchorManager.capture({
      scrollOffset: effectiveScrollOffset,
      rangeStart: rangeRef.current.start,
      count: axisModel.count,
      getOffsetByIndex: axisModel.getOffsetByIndex,
    });

    let didUpdate = false;
    for (const [observedElement, index] of state.observed.entries()) {
      const rect = observedElement.getBoundingClientRect();
      const size = Math.max(0, direction === 'horizontal' ? rect.width : rect.height);
      axisModel.setSize(index, size);
      didUpdate = true;
    }

    const viewportElement = viewportRef.current;
    if (viewportElement && didUpdate) {
      const nextOffset = anchorManager.apply(anchor, {
        count: axisModel.count,
        getOffsetByIndex: axisModel.getOffsetByIndex,
      });
      const finalOffset = nextOffset + startOffset;
      if (direction === 'horizontal') {
        if (Math.abs(viewportElement.scrollLeft - finalOffset) > 0.5) {
          viewportElement.scrollLeft = finalOffset;
        }
      } else if (Math.abs(viewportElement.scrollTop - finalOffset) > 0.5) {
        viewportElement.scrollTop = finalOffset;
      }
    }

    setMeasureVersion((value) => value + 1);
  }, [anchorManager, direction, estimatedItemSize, itemSize, sizeMode, sticky?.top, viewportRef]);

  return {
    totalSize: axis.totalSize,
    items,
    offset: range.offset,
    scrollToIndex,
    measureElement: sizeMode === 'dynamic' ? measureElement : undefined,
    measure,
    range: { start: range.start, end: range.end },
  };
}
