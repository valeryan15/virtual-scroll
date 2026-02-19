import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { CSSProperties, MutableRefObject, Ref, RefObject, ReactElement } from 'react';
import { useScrollPosition } from './hooks/useScrollPosition';
import { useVirtualGrid } from './hooks/useVirtualGrid';
import { CornerLayer } from './internal/layers/CornerLayer';
import { StickyLayer } from './internal/layers/StickyLayer';
import { VirtualBodyLayer } from './internal/layers/VirtualBodyLayer';
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
  direction: 'start' | 'end' = 'start',
) => {
  const result: { index: number; offset: number; size: number }[] = [];
  let offset = 0;
  for (let step = 0; step < count; step += 1) {
    const index = direction === 'start' ? startIndex + step : startIndex + count - 1 - step;
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
    ssr,
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

  const renderTopStickyRow = sticky?.renderTopStickyRow;
  const renderBottomStickyRow = sticky?.renderBottomStickyRow ?? renderTopStickyRow;
  const renderLeftStickyColumn = sticky?.renderLeftStickyColumn;
  const renderRightStickyColumn = sticky?.renderRightStickyColumn ?? renderLeftStickyColumn;
  const renderCorner = sticky?.renderCorner;

  // Sticky-количества ограничиваем доступными строками/колонками, чтобы избежать пересечений.
  const topCount = renderTopStickyRow ? Math.min(sticky?.top ?? 0, rowCount) : 0;
  const bottomCount = renderBottomStickyRow ? Math.min(sticky?.bottom ?? 0, rowCount - topCount) : 0;
  const leftCount = renderLeftStickyColumn ? Math.min(sticky?.left ?? 0, columnCount) : 0;
  const rightCount = renderRightStickyColumn ? Math.min(sticky?.right ?? 0, columnCount - leftCount) : 0;
  const bodyRowCount = Math.max(0, rowCount - topCount - bottomCount);
  const bodyColumnCount = Math.max(0, columnCount - leftCount - rightCount);
  const ssrBodyRows = Math.max(0, Math.min(bodyRowCount, (ssr?.rows ?? 0) - topCount));
  const ssrBodyColumns = Math.max(0, Math.min(bodyColumnCount, (ssr?.columns ?? 0) - leftCount));

  const rowSize = useCallback((index: number) => getAxisItemSize(rows, index), [rows]);
  const columnSize = useCallback((index: number) => getAxisItemSize(columns, index), [columns]);

  // Sticky-offsets считаем от начала/конца, суммируя фиксированные/оценочные размеры.
  const topRows = useMemo(() => buildStickyOffsets(0, topCount, rowSize), [rowSize, topCount]);
  const bottomRows = useMemo(
    () => buildStickyOffsets(rowCount - bottomCount, bottomCount, rowSize, 'end'),
    [bottomCount, rowCount, rowSize],
  );
  const leftColumns = useMemo(() => buildStickyOffsets(0, leftCount, columnSize), [columnSize, leftCount]);
  const rightColumns = useMemo(
    () => buildStickyOffsets(columnCount - rightCount, rightCount, columnSize, 'end'),
    [columnCount, columnSize, rightCount],
  );

  // Sticky-экстенты (px) используются для смещения виртуализированного body viewport.
  const topHeight = sumAxisSizes(0, topCount, rowSize);
  const bottomHeight = sumAxisSizes(rowCount - bottomCount, bottomCount, rowSize);
  const leftWidth = sumAxisSizes(0, leftCount, columnSize);
  const rightWidth = sumAxisSizes(columnCount - rightCount, rightCount, columnSize);

  const {
    cells,
    totalHeight,
    totalWidth,
    range,
    scrollToColumn: scrollToBodyColumn,
    scrollToRow: scrollToBodyRow,
    measureRowElement,
    measureColumnElement,
    measure,
  } = useVirtualGrid({
    rowCount: bodyRowCount,
    columnCount: bodyColumnCount,
    viewportRef,
    rows,
    columns,
    overscan,
    sticky: { top: topCount, bottom: bottomCount, left: leftCount, right: rightCount },
    ssr: ssrBodyRows > 0 || ssrBodyColumns > 0 ? { rows: ssrBodyRows, columns: ssrBodyColumns } : undefined,
    onRangeChange: (rangeValue) =>
      onRangeChange?.({
        rows: { start: rangeValue.rows.start + topCount, end: rangeValue.rows.end + topCount },
        columns: {
          start: rangeValue.columns.start + leftCount,
          end: rangeValue.columns.end + leftCount,
        },
      }),
  });

  const scrollPosition = useScrollPosition(viewportRef);
  const currentScrollTop = viewportRef.current?.scrollTop ?? scrollPosition.top;
  const currentScrollLeft = viewportRef.current?.scrollLeft ?? scrollPosition.left;
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
      scrollToRow: (rowIndex, options) => {
        if (bodyRowCount <= 0) {
          return;
        }
        const bodyIndex = rowIndex - topCount;
        if (bodyIndex < 0) {
          scrollToBodyRow(0, { ...options, align: 'start' });
          return;
        }
        if (bodyIndex >= bodyRowCount) {
          scrollToBodyRow(bodyRowCount - 1, { ...options, align: 'end' });
          return;
        }
        scrollToBodyRow(bodyIndex, options);
      },
      scrollToColumn: (columnIndex, options) => {
        if (bodyColumnCount <= 0) {
          return;
        }
        const bodyIndex = columnIndex - leftCount;
        if (bodyIndex < 0) {
          scrollToBodyColumn(0, { ...options, align: 'start' });
          return;
        }
        if (bodyIndex >= bodyColumnCount) {
          scrollToBodyColumn(bodyColumnCount - 1, { ...options, align: 'end' });
          return;
        }
        scrollToBodyColumn(bodyIndex, options);
      },
      scrollToCell: (rowIndex, columnIndex, options) => {
        if (bodyRowCount <= 0 || bodyColumnCount <= 0) {
          return;
        }
        const bodyRow = rowIndex - topCount;
        const bodyColumn = columnIndex - leftCount;
        if (bodyRow >= 0 && bodyRow < bodyRowCount) {
          scrollToBodyRow(bodyRow, options);
        } else if (bodyRow < 0) {
          scrollToBodyRow(0, { ...options, align: 'start' });
        } else {
          scrollToBodyRow(bodyRowCount - 1, { ...options, align: 'end' });
        }
        if (bodyColumn >= 0 && bodyColumn < bodyColumnCount) {
          scrollToBodyColumn(bodyColumn, options);
        } else if (bodyColumn < 0) {
          scrollToBodyColumn(0, { ...options, align: 'start' });
        } else {
          scrollToBodyColumn(bodyColumnCount - 1, { ...options, align: 'end' });
        }
      },
      getScrollPosition: () => ({
        top: viewportRef.current?.scrollTop ?? 0,
        left: viewportRef.current?.scrollLeft ?? 0,
      }),
      getVisibleRange: () => ({
        rows: { start: range.rows.start + topCount, end: range.rows.end + topCount },
        columns: { start: range.columns.start + leftCount, end: range.columns.end + leftCount },
      }),
      measure,
    }),
    [
      bodyColumnCount,
      bodyRowCount,
      leftCount,
      measure,
      range.columns.end,
      range.columns.start,
      range.rows.end,
      range.rows.start,
      scrollToBodyColumn,
      scrollToBodyRow,
      topCount,
      viewportRef,
    ],
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
      width: totalWidth + leftWidth + rightWidth,
      height: totalHeight + topHeight + bottomHeight,
      // Резервируем место под верхние/левые sticky-регионы, чтобы body начинался после них.
      paddingTop: topHeight,
      paddingBottom: bottomHeight,
      paddingLeft: leftWidth,
      paddingRight: rightWidth,
      boxSizing: 'border-box',
    }),
    [bottomHeight, leftWidth, rightWidth, topHeight, totalHeight, totalWidth],
  );

  const shouldMeasureRow = (columnIndex: number) => columnIndex === range.columns.start;
  const shouldMeasureColumn = (rowIndex: number) => rowIndex === range.rows.start;

  return (
    <div
      ref={setViewportRef}
      className={className}
      style={viewportStyle}
    >
      <VirtualBodyLayer style={contentStyle}>
        {cells.map((cell) => {
          const actualRowIndex = cell.rowIndex + topCount;
          const actualColumnIndex = cell.columnIndex + leftCount;
          const key = cellKey ? cellKey(actualRowIndex, actualColumnIndex) : cell.key;
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
              {renderCell({ rowIndex: actualRowIndex, columnIndex: actualColumnIndex })}
            </div>
          );
        })}
      </VirtualBodyLayer>

      {renderTopStickyRow && topRows.length > 0 && (
        <StickyLayer
          orientation='row'
          position='start'
          items={topRows}
          scrollOffsetX={currentScrollLeft}
          scrollOffsetY={currentScrollTop}
          render={({ index }) => renderTopStickyRow({ rowIndex: index })}
        />
      )}
      {renderBottomStickyRow && bottomRows.length > 0 && (
        <StickyLayer
          orientation='row'
          position='end'
          items={bottomRows}
          scrollOffsetX={currentScrollLeft}
          scrollOffsetY={currentScrollTop}
          render={({ index }) => renderBottomStickyRow({ rowIndex: index })}
        />
      )}
      {renderLeftStickyColumn && leftColumns.length > 0 && (
        <StickyLayer
          orientation='column'
          position='start'
          items={leftColumns}
          scrollOffsetX={currentScrollLeft}
          scrollOffsetY={currentScrollTop}
          render={({ index }) => renderLeftStickyColumn({ columnIndex: index })}
        />
      )}
      {renderRightStickyColumn && rightColumns.length > 0 && (
        <StickyLayer
          orientation='column'
          position='end'
          items={rightColumns}
          scrollOffsetX={currentScrollLeft}
          scrollOffsetY={currentScrollTop}
          render={({ index }) => renderRightStickyColumn({ columnIndex: index })}
        />
      )}
      {renderCorner && topCount > 0 && leftCount > 0 && (
        <CornerLayer
          corner='tl'
          width={leftWidth}
          height={topHeight}
          scrollOffsetX={currentScrollLeft}
          scrollOffsetY={currentScrollTop}
          render={renderCorner}
        />
      )}
      {renderCorner && topCount > 0 && rightCount > 0 && (
        <CornerLayer
          corner='tr'
          width={rightWidth}
          height={topHeight}
          scrollOffsetX={currentScrollLeft}
          scrollOffsetY={currentScrollTop}
          render={renderCorner}
        />
      )}
      {renderCorner && bottomCount > 0 && leftCount > 0 && (
        <CornerLayer
          corner='bl'
          width={leftWidth}
          height={bottomHeight}
          scrollOffsetX={currentScrollLeft}
          scrollOffsetY={currentScrollTop}
          render={renderCorner}
        />
      )}
      {renderCorner && bottomCount > 0 && rightCount > 0 && (
        <CornerLayer
          corner='br'
          width={rightWidth}
          height={bottomHeight}
          scrollOffsetX={currentScrollLeft}
          scrollOffsetY={currentScrollTop}
          render={renderCorner}
        />
      )}
    </div>
  );
}

export const VirtualGrid = forwardRef(VirtualGridInner) as (
  props: VirtualGridProps & { ref?: Ref<VirtualGridHandle> },
) => ReactElement;
