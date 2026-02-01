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
  viewportRef: RefObject<HTMLElement>;
  sizeMode: 'fixed' | 'dynamic';
  itemSize?: number;
  estimatedItemSize?: number;
  overscan?: Overscan1D;
  sticky?: { top?: number; bottom?: number };
  onRangeChange?: (range: { start: number; end: number }) => void;
};

type UseVirtualListResult = {
  totalSize: number;
  items: VirtualItem[];
  offset: number;
  scrollToIndex: (index: number, options?: ScrollToIndexOptions) => void;
  measureElement?: (index: number, el: HTMLElement | null) => void;
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
    sizeMode,
    itemSize,
    estimatedItemSize,
    overscan,
    onRangeChange,
  } = args;
  const overscanValue = getOverscanValue(overscan);
  const anchorManager = useMemo(() => createAnchorManager(), []);
  const [measureVersion, setMeasureVersion] = useState(0);
  const scrollPosition = useScrollPosition(viewportRef);
  const viewportSize = useViewportSize(viewportRef);

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
    const currentScrollTop = viewportRef.current?.scrollTop ?? scrollPosition.top;
    return axis.getRange(currentScrollTop, viewportSize.height, overscanValue);
  }, [axis, overscanValue, scrollPosition.top, viewportRef, viewportSize.height, measureVersion]);

  const rangeRef = useRef(range);
  const scrollOffsetRef = useRef(scrollPosition.top);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);
  useEffect(() => {
    scrollOffsetRef.current = scrollPosition.top;
  }, [scrollPosition.top]);

  useEffect(() => {
    onRangeChange?.({ start: range.start, end: range.end });
  }, [onRangeChange, range.end, range.start]);

  const scrollToIndex = useCallback(
    (index: number, options?: ScrollToIndexOptions) => {
      const element = viewportRef.current;
      if (!element) {
        return;
      }

      const axisModel = axisRef.current;
      const safeIndex = Math.min(Math.max(index, 0), axisModel.count - 1);
      const baseOffset = axisModel.getOffsetByIndex(safeIndex);
      const itemExtent = getItemSizeFromAxis(axisModel, safeIndex, itemSize ?? 0);
      const viewportExtent = viewportSize.height;
      const align = options?.align ?? 'start';
      let targetOffset = baseOffset;

      if (align === 'center') {
        targetOffset = baseOffset - (viewportExtent - itemExtent) / 2;
      } else if (align === 'end') {
        targetOffset = baseOffset - (viewportExtent - itemExtent);
      } else if (align === 'nearest') {
        const current = element.scrollTop;
        const end = baseOffset + itemExtent;
        const viewportEnd = current + viewportExtent;
        if (baseOffset >= current && end <= viewportEnd) {
          return;
        }
        targetOffset = baseOffset < current ? baseOffset : end - viewportExtent;
      }

      element.scrollTo({ top: Math.max(0, targetOffset), behavior: options?.behavior });
    },
    [itemSize, viewportRef, viewportSize.height],
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

        const currentScrollOffset = viewportRef.current?.scrollTop ?? scrollOffsetRef.current;
        const anchor = anchorManager.capture({
          scrollOffset: currentScrollOffset,
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
          if (Math.abs(element.scrollTop - nextOffset) > 0.5) {
            element.scrollTop = nextOffset;
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
  }, [anchorManager, sizeMode, viewportRef]);

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

  return {
    totalSize: axis.totalSize,
    items,
    offset: range.offset,
    scrollToIndex,
    measureElement: sizeMode === 'dynamic' ? measureElement : undefined,
    range: { start: range.start, end: range.end },
  };
}
