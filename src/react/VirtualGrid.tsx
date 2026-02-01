import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { CSSProperties, MutableRefObject, Ref, RefObject, ReactElement } from 'react';
import { useScrollPosition } from './hooks/useScrollPosition';
import { useVirtualGrid } from './hooks/useVirtualGrid';
import type { AxisConfig } from '../shared/types';
import type { VirtualGridHandle, VirtualGridProps } from './types';

const assignRef = (target: RefObject<HTMLElement | null> | undefined, value: HTMLElement | null) => {
  if (target) {
    (target as MutableRefObject<HTMLElement | null>).current = value;
  }
};

const getAxisItemSize = (config: AxisConfig, _index: number) => {
  if (config.sizeMode === 'fixed') {
    return config.itemSize;
  }
  return config.estimatedItemSize;
};

const buildStickyOffsets = (
  startIndex: number,
  count: number,
  sizeForIndex: (index: number) => number,
) => {
  const result: { index: number; offset: number; size: number }[] = [];
  let offset = 0;
  for (let step = 0; step < count; step += 1) {
    const index = startIndex + step;
    const size = sizeForIndex(index);
    result.push({ index, offset, size });
    offset += size;
  }
  return result;
};

const sumAxisSizes = (startIndex: number, count: number, sizeForIndex: (index: number) => number) => {
  let total = 0;
  for (let step = 0; step < count; step += 1) {
    total += sizeForIndex(startIndex + step);
  }
  return total;
};

function VirtualGridInner(props: VirtualGridProps, ref: Ref<VirtualGridHandle>) {
  const {
    rowCount,
    columnCount,
    cellKey,
    renderCell,
    rows,
    columns,
    sticky,
    overscan,
    scroll,
    onRangeChange,
    className,
    style,
  } = props;

  const internalRef = useRef<HTMLElement | null>(null);
  const viewportRef = (scroll?.containerRef ?? internalRef) as RefObject<HTMLElement | null>;
  const setViewportRef = useCallback(
    (node: HTMLElement | null) => {
      internalRef.current = node;
      assignRef(scroll?.containerRef, node);
    },
    [scroll?.containerRef],
  );

  const {
    cells,
    totalHeight,
    totalWidth,
    range,
    scrollToCell,
    scrollToColumn,
    scrollToRow,
    measureRowElement,
    measureColumnElement,
    measure,
  } = useVirtualGrid({
    rowCount,
    columnCount,
    viewportRef,
    rows,
    columns,
    overscan,
    sticky,
    onRangeChange,
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
      scrollToRow,
      scrollToColumn,
      scrollToCell,
      getScrollPosition: () => ({
        top: viewportRef.current?.scrollTop ?? 0,
        left: viewportRef.current?.scrollLeft ?? 0,
      }),
      getVisibleRange: () => range,
      measure,
    }),
    [measure, range, scrollToCell, scrollToColumn, scrollToRow, viewportRef],
  );

  const viewportStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      overflow: 'auto',
      ...style,
    }),
    [style],
  );

  const contentStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      width: totalWidth,
      height: totalHeight,
    }),
    [totalHeight, totalWidth],
  );

  const topCount = Math.min(sticky?.top ?? 0, rowCount);
  const bottomCount = Math.min(sticky?.bottom ?? 0, rowCount);
  const leftCount = Math.min(sticky?.left ?? 0, columnCount);
  const rightCount = Math.min(sticky?.right ?? 0, columnCount);

  const rowSize = useCallback((index: number) => getAxisItemSize(rows, index), [rows]);
  const columnSize = useCallback((index: number) => getAxisItemSize(columns, index), [columns]);

  const topRows = useMemo(() => buildStickyOffsets(0, topCount, rowSize), [rowSize, topCount]);
  const bottomRows = useMemo(
    () => buildStickyOffsets(rowCount - bottomCount, bottomCount, rowSize),
    [bottomCount, rowCount, rowSize],
  );
  const leftColumns = useMemo(() => buildStickyOffsets(0, leftCount, columnSize), [columnSize, leftCount]);
  const rightColumns = useMemo(
    () => buildStickyOffsets(columnCount - rightCount, rightCount, columnSize),
    [columnCount, columnSize, rightCount],
  );

  const topHeight = sumAxisSizes(0, topCount, rowSize);
  const bottomHeight = sumAxisSizes(rowCount - bottomCount, bottomCount, rowSize);
  const leftWidth = sumAxisSizes(0, leftCount, columnSize);
  const rightWidth = sumAxisSizes(columnCount - rightCount, rightCount, columnSize);

  const shouldMeasureRow = (columnIndex: number) => columnIndex === range.columns.start;
  const shouldMeasureColumn = (rowIndex: number) => rowIndex === range.rows.start;

  const renderTopStickyRow = sticky?.renderTopStickyRow;
  const renderLeftStickyColumn = sticky?.renderLeftStickyColumn;
  const renderCorner = sticky?.renderCorner;

  return (
    <div ref={setViewportRef} className={className} style={viewportStyle}>
      <div style={contentStyle}>
        {cells.map((cell) => {
          const key = cellKey ? cellKey(cell.rowIndex, cell.columnIndex) : cell.key;
          const measureRow = !!measureRowElement && shouldMeasureRow(cell.columnIndex);
          const measureColumn = !!measureColumnElement && shouldMeasureColumn(cell.rowIndex);
          const setRef = (node: HTMLElement | null) => {
            if (measureRow) {
              measureRowElement?.(cell.rowIndex, node);
            }
            if (measureColumn) {
              measureColumnElement?.(cell.columnIndex, node);
            }
          };

          return (
            <div
              key={key}
              ref={setRef}
              style={{
                position: 'absolute',
                top: cell.y,
                left: cell.x,
                width: cell.width,
                height: cell.height,
              }}
            >
              {renderCell({ rowIndex: cell.rowIndex, columnIndex: cell.columnIndex })}
            </div>
          );
        })}
      </div>

      {(renderTopStickyRow || renderLeftStickyColumn || renderCorner) &&
        (topCount > 0 || bottomCount > 0 || leftCount > 0 || rightCount > 0) && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
            {renderTopStickyRow &&
              topRows.map((row) => (
                <div
                  key={`top-${row.index}`}
                  style={{ position: 'absolute', top: row.offset, left: 0, right: 0, height: row.size }}
                >
                  <div style={{ pointerEvents: 'auto', height: '100%' }}>
                    {renderTopStickyRow({ rowIndex: row.index })}
                  </div>
                </div>
              ))}
            {renderTopStickyRow &&
              bottomRows.map((row) => (
                <div
                  key={`bottom-${row.index}`}
                  style={{ position: 'absolute', bottom: row.offset, left: 0, right: 0, height: row.size }}
                >
                  <div style={{ pointerEvents: 'auto', height: '100%' }}>
                    {renderTopStickyRow({ rowIndex: row.index })}
                  </div>
                </div>
              ))}
            {renderLeftStickyColumn &&
              leftColumns.map((column) => (
                <div
                  key={`left-${column.index}`}
                  style={{ position: 'absolute', left: column.offset, top: 0, bottom: 0, width: column.size }}
                >
                  <div style={{ pointerEvents: 'auto', height: '100%' }}>
                    {renderLeftStickyColumn({ columnIndex: column.index })}
                  </div>
                </div>
              ))}
            {renderLeftStickyColumn &&
              rightColumns.map((column) => (
                <div
                  key={`right-${column.index}`}
                  style={{ position: 'absolute', right: column.offset, top: 0, bottom: 0, width: column.size }}
                >
                  <div style={{ pointerEvents: 'auto', height: '100%' }}>
                    {renderLeftStickyColumn({ columnIndex: column.index })}
                  </div>
                </div>
              ))}
            {renderCorner && topCount > 0 && leftCount > 0 && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: leftWidth, height: topHeight }}>
                <div style={{ pointerEvents: 'auto', height: '100%' }}>
                  {renderCorner({ corner: 'tl' })}
                </div>
              </div>
            )}
            {renderCorner && topCount > 0 && rightCount > 0 && (
              <div style={{ position: 'absolute', top: 0, right: 0, width: rightWidth, height: topHeight }}>
                <div style={{ pointerEvents: 'auto', height: '100%' }}>
                  {renderCorner({ corner: 'tr' })}
                </div>
              </div>
            )}
            {renderCorner && bottomCount > 0 && leftCount > 0 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: leftWidth, height: bottomHeight }}>
                <div style={{ pointerEvents: 'auto', height: '100%' }}>
                  {renderCorner({ corner: 'bl' })}
                </div>
              </div>
            )}
            {renderCorner && bottomCount > 0 && rightCount > 0 && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: rightWidth, height: bottomHeight }}>
                <div style={{ pointerEvents: 'auto', height: '100%' }}>
                  {renderCorner({ corner: 'br' })}
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export const VirtualGrid = forwardRef(VirtualGridInner) as (
  props: VirtualGridProps & { ref?: Ref<VirtualGridHandle> },
) => ReactElement;
