import type { CSSProperties, Key, ReactNode, RefObject } from 'react';
import type { AxisConfig, GridOverscan, GridRange, Overscan1D, ScrollPosition, ScrollToIndexOptions } from '../shared/types';

export type VirtualListProps<T> = {
  items: readonly T[];
  itemKey: (item: T, index: number) => Key;
  renderItem: (args: { item: T; index: number }) => ReactNode;
  layout?: {
    direction?: 'vertical' | 'horizontal';
    sizeMode?: 'fixed' | 'dynamic';
    itemSize?: number;
    estimatedItemSize?: number;
  };
  overscan?: Overscan1D;
  sticky?: {
    top?: number;
    bottom?: number;
    renderStickyTop?: (args: { items: readonly T[] }) => ReactNode;
    renderStickyBottom?: (args: { items: readonly T[] }) => ReactNode;
  };
  scroll?: {
    position?: ScrollPosition;
    onScroll?: (pos: ScrollPosition) => void;
    containerRef?: RefObject<HTMLElement>;
  };
  onRangeChange?: (range: { items: { start: number; end: number } }) => void;
  className?: string;
  style?: CSSProperties;
};

export type VirtualGridProps = {
  rowCount: number;
  columnCount: number;
  cellKey?: (rowIndex: number, columnIndex: number) => Key;
  renderCell: (args: { rowIndex: number; columnIndex: number }) => ReactNode;
  rows: AxisConfig;
  columns: AxisConfig;
  sticky?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    renderTopStickyRow?: (args: { rowIndex: number }) => ReactNode;
    renderLeftStickyColumn?: (args: { columnIndex: number }) => ReactNode;
    renderCorner?: (args: { corner: 'tl' | 'tr' | 'bl' | 'br' }) => ReactNode;
  };
  overscan?: GridOverscan;
  scroll?: {
    position?: ScrollPosition;
    onScroll?: (pos: ScrollPosition) => void;
    containerRef?: RefObject<HTMLElement>;
  };
  onRangeChange?: (range: GridRange) => void;
  className?: string;
  style?: CSSProperties;
};

export type VirtualListHandle = {
  scrollToIndex: (index: number, options?: ScrollToIndexOptions) => void;
  getScrollPosition: () => ScrollPosition;
  getVisibleRange: () => { start: number; end: number };
  measure: () => void;
};

export type VirtualGridHandle = {
  scrollToRow: (rowIndex: number, options?: ScrollToIndexOptions) => void;
  scrollToColumn: (columnIndex: number, options?: ScrollToIndexOptions) => void;
  scrollToCell: (rowIndex: number, columnIndex: number, options?: ScrollToIndexOptions) => void;
  getScrollPosition: () => ScrollPosition;
  getVisibleRange: () => GridRange;
  measure: () => void;
};
