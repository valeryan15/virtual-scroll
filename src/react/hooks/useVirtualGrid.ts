import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Key, RefObject } from 'react';
import { createAnchorManager } from '../../core/anchor/anchorManager';
import { createDynamicAxisModel } from '../../core/axis/dynamicAxis';
import { createFixedAxisModel } from '../../core/axis/fixedAxis';
import type { AxisModel } from '../../core/axis/axis.types';
import type { AxisConfig, GridOverscan, GridRange, Overscan1D, ScrollToIndexOptions } from '../../shared/types';
import { useScrollPosition } from './useScrollPosition';
import { useViewportSize } from './useViewportSize';

type VirtualCell = {
  rowIndex: number;
  columnIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  key: Key;
};

type UseVirtualGridArgs = {
  rowCount: number;
  columnCount: number;
  viewportRef: RefObject<HTMLElement>;
  rows: AxisConfig;
  columns: AxisConfig;
  overscan?: GridOverscan;
  sticky?: { top?: number; bottom?: number; left?: number; right?: number };
  onRangeChange?: (range: GridRange) => void;
};

type UseVirtualGridResult = {
  totalWidth: number;
  totalHeight: number;
  cells: VirtualCell[];
  range: GridRange;
  scrollToCell: (rowIndex: number, columnIndex: number, options?: ScrollToIndexOptions) => void;
  scrollToRow: (rowIndex: number, options?: ScrollToIndexOptions) => void;
  scrollToColumn: (columnIndex: number, options?: ScrollToIndexOptions) => void;
  measureRowElement?: (rowIndex: number, element: HTMLElement | null) => void;
  measureColumnElement?: (columnIndex: number, element: HTMLElement | null) => void;
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

const resolveGridOverscan = (overscan?: GridOverscan) => {
  if (typeof overscan === 'number') {
    return { rows: overscan, columns: overscan };
  }

  return {
    rows: getOverscanValue(overscan?.rows),
    columns: getOverscanValue(overscan?.columns),
  };
};

const getItemSizeFromAxis = (axis: AxisModel, index: number, fallback: number) => {
  if ('getSize' in axis && typeof axis.getSize === 'function') {
    return axis.getSize(index);
  }

  return fallback;
};

const createAxis = (config: AxisConfig, count: number, overscan?: number) => {
  if (config.sizeMode === 'dynamic') {
    return createDynamicAxisModel({
      count,
      estimatedItemSize: config.estimatedItemSize,
      overscan,
    });
  }

  return createFixedAxisModel({
    count,
    itemSize: config.itemSize,
    overscan,
  });
};

export function useVirtualGrid(args: UseVirtualGridArgs): UseVirtualGridResult {
  const { rowCount, columnCount, viewportRef, rows, columns, overscan, onRangeChange } = args;
  const overscanValue = resolveGridOverscan(overscan);
  const anchorManager = useMemo(() => createAnchorManager(), []);
  const [measureVersion, setMeasureVersion] = useState(0);
  const scrollPosition = useScrollPosition(viewportRef);
  const viewportSize = useViewportSize(viewportRef);

  const rowAxis = useMemo(
    () => createAxis(rows, rowCount, overscanValue.rows),
    [rows, rowCount, overscanValue.rows],
  );
  const columnAxis = useMemo(
    () => createAxis(columns, columnCount, overscanValue.columns),
    [columns, columnCount, overscanValue.columns],
  );

  const rowAxisRef = useRef(rowAxis);
  const columnAxisRef = useRef(columnAxis);
  rowAxisRef.current = rowAxis;
  columnAxisRef.current = columnAxis;

  const range = useMemo<GridRange>(() => {
    const rowRange = rowAxis.getRange(scrollPosition.top, viewportSize.height, overscanValue.rows);
    const columnRange = columnAxis.getRange(scrollPosition.left, viewportSize.width, overscanValue.columns);
    return {
      rows: { start: rowRange.start, end: rowRange.end },
      columns: { start: columnRange.start, end: columnRange.end },
    };
  }, [
    columnAxis,
    overscanValue.columns,
    overscanValue.rows,
    rowAxis,
    scrollPosition.left,
    scrollPosition.top,
    viewportSize.height,
    viewportSize.width,
    measureVersion,
  ]);

  const rangeRef = useRef(range);
  const scrollTopRef = useRef(scrollPosition.top);
  const scrollLeftRef = useRef(scrollPosition.left);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);
  useEffect(() => {
    scrollTopRef.current = scrollPosition.top;
  }, [scrollPosition.top]);
  useEffect(() => {
    scrollLeftRef.current = scrollPosition.left;
  }, [scrollPosition.left]);

  useEffect(() => {
    onRangeChange?.(range);
  }, [onRangeChange, range]);

  const scrollToRow = useCallback(
    (rowIndex: number, options?: ScrollToIndexOptions) => {
      const element = viewportRef.current;
      if (!element) {
        return;
      }
      const axisModel = rowAxisRef.current;
      const safeIndex = Math.min(Math.max(rowIndex, 0), axisModel.count - 1);
      const baseOffset = axisModel.getOffsetByIndex(safeIndex);
      const itemExtent = getItemSizeFromAxis(axisModel, safeIndex, rows.sizeMode === 'fixed' ? rows.itemSize : 0);
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
    [rows, viewportRef, viewportSize.height],
  );

  const scrollToColumn = useCallback(
    (columnIndex: number, options?: ScrollToIndexOptions) => {
      const element = viewportRef.current;
      if (!element) {
        return;
      }
      const axisModel = columnAxisRef.current;
      const safeIndex = Math.min(Math.max(columnIndex, 0), axisModel.count - 1);
      const baseOffset = axisModel.getOffsetByIndex(safeIndex);
      const itemExtent = getItemSizeFromAxis(
        axisModel,
        safeIndex,
        columns.sizeMode === 'fixed' ? columns.itemSize : 0,
      );
      const viewportExtent = viewportSize.width;
      const align = options?.align ?? 'start';
      let targetOffset = baseOffset;

      if (align === 'center') {
        targetOffset = baseOffset - (viewportExtent - itemExtent) / 2;
      } else if (align === 'end') {
        targetOffset = baseOffset - (viewportExtent - itemExtent);
      } else if (align === 'nearest') {
        const current = element.scrollLeft;
        const end = baseOffset + itemExtent;
        const viewportEnd = current + viewportExtent;
        if (baseOffset >= current && end <= viewportEnd) {
          return;
        }
        targetOffset = baseOffset < current ? baseOffset : end - viewportExtent;
      }

      element.scrollTo({ left: Math.max(0, targetOffset), behavior: options?.behavior });
    },
    [columns, viewportRef, viewportSize.width],
  );

  const scrollToCell = useCallback(
    (rowIndex: number, columnIndex: number, options?: ScrollToIndexOptions) => {
      scrollToRow(rowIndex, options);
      scrollToColumn(columnIndex, options);
    },
    [scrollToColumn, scrollToRow],
  );

  const rowMeasurementRef = useRef<{
    observer: ResizeObserver;
    observed: Map<HTMLElement, number>;
    pending: Map<number, number>;
    frame: number | null;
  } | null>(null);

  const columnMeasurementRef = useRef<{
    observer: ResizeObserver;
    observed: Map<HTMLElement, number>;
    pending: Map<number, number>;
    frame: number | null;
  } | null>(null);

  useEffect(() => {
    if (rows.sizeMode !== 'dynamic' || typeof ResizeObserver === 'undefined') {
      rowMeasurementRef.current?.observer.disconnect();
      rowMeasurementRef.current = null;
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

      const state = rowMeasurementRef.current;
      if (!state || state.frame !== null) {
        return;
      }

      state.frame = requestAnimationFrame(() => {
        if (!rowMeasurementRef.current) {
          return;
        }
        rowMeasurementRef.current.frame = null;

        const axisModel = rowAxisRef.current;
        if (!('setSize' in axisModel) || typeof axisModel.setSize !== 'function') {
          pending.clear();
          return;
        }

        const anchor = anchorManager.capture({
          scrollOffset: scrollTopRef.current,
          rangeStart: rangeRef.current.rows.start,
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

    rowMeasurementRef.current = {
      observer,
      observed,
      pending,
      frame: null,
    };

    return () => {
      const state = rowMeasurementRef.current;
      if (!state) {
        return;
      }
      if (state.frame !== null) {
        cancelAnimationFrame(state.frame);
      }
      state.observer.disconnect();
      rowMeasurementRef.current = null;
    };
  }, [anchorManager, rows.sizeMode, viewportRef]);

  useEffect(() => {
    if (columns.sizeMode !== 'dynamic' || typeof ResizeObserver === 'undefined') {
      columnMeasurementRef.current?.observer.disconnect();
      columnMeasurementRef.current = null;
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
        const size = Math.max(0, entry.contentRect.width);
        pending.set(index, size);
      }

      const state = columnMeasurementRef.current;
      if (!state || state.frame !== null) {
        return;
      }

      state.frame = requestAnimationFrame(() => {
        if (!columnMeasurementRef.current) {
          return;
        }
        columnMeasurementRef.current.frame = null;

        const axisModel = columnAxisRef.current;
        if (!('setSize' in axisModel) || typeof axisModel.setSize !== 'function') {
          pending.clear();
          return;
        }

        const anchor = anchorManager.capture({
          scrollOffset: scrollLeftRef.current,
          rangeStart: rangeRef.current.columns.start,
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
          if (Math.abs(element.scrollLeft - nextOffset) > 0.5) {
            element.scrollLeft = nextOffset;
          }
        }

        setMeasureVersion((value) => value + 1);
      });
    });

    columnMeasurementRef.current = {
      observer,
      observed,
      pending,
      frame: null,
    };

    return () => {
      const state = columnMeasurementRef.current;
      if (!state) {
        return;
      }
      if (state.frame !== null) {
        cancelAnimationFrame(state.frame);
      }
      state.observer.disconnect();
      columnMeasurementRef.current = null;
    };
  }, [anchorManager, columns.sizeMode, viewportRef]);

  const measureRowElement = useCallback((index: number, element: HTMLElement | null) => {
    const state = rowMeasurementRef.current;
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
  }, []);

  const measureColumnElement = useCallback((index: number, element: HTMLElement | null) => {
    const state = columnMeasurementRef.current;
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
  }, []);

  const cells = useMemo(() => {
    const result: VirtualCell[] = [];
    for (let rowIndex = range.rows.start; rowIndex < range.rows.end; rowIndex += 1) {
      const y = rowAxis.getOffsetByIndex(rowIndex);
      const height = getItemSizeFromAxis(rowAxis, rowIndex, rows.sizeMode === 'fixed' ? rows.itemSize : 0);
      for (let columnIndex = range.columns.start; columnIndex < range.columns.end; columnIndex += 1) {
        const x = columnAxis.getOffsetByIndex(columnIndex);
        const width = getItemSizeFromAxis(
          columnAxis,
          columnIndex,
          columns.sizeMode === 'fixed' ? columns.itemSize : 0,
        );
        result.push({
          rowIndex,
          columnIndex,
          x,
          y,
          width,
          height,
          key: `${rowIndex}:${columnIndex}`,
        });
      }
    }
    return result;
  }, [columnAxis, columns, range.columns.end, range.columns.start, range.rows.end, range.rows.start, rowAxis, rows]);

  return {
    totalWidth: columnAxis.totalSize,
    totalHeight: rowAxis.totalSize,
    cells,
    range,
    scrollToCell,
    scrollToRow,
    scrollToColumn,
    measureRowElement: rows.sizeMode === 'dynamic' ? measureRowElement : undefined,
    measureColumnElement: columns.sizeMode === 'dynamic' ? measureColumnElement : undefined,
  };
}
