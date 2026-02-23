# Публичный API библиотеки Virtualization

## 1) High-level компоненты

### `VirtualList`

1D виртуализация (список), вертикальная по умолчанию.

```ts
type VirtualListProps<T> = {
  items: readonly T[];
  itemKey: (item: T, index: number) => React.Key;

  /** Рендер элемента. index — индекс в items */
  renderItem: (args: { item: T; index: number }) => React.ReactNode;

  /** Размеры */
  layout?: {
    direction?: 'vertical' | 'horizontal';
    sizeMode?: 'fixed' | 'dynamic';
    itemSize?: number; // required for fixed
    estimatedItemSize?: number; // required for dynamic
  };

  /** Окно рендера */
  overscan?: number | { before?: number; after?: number };

  /** Sticky (для List обычно top/bottom) */
  sticky?: {
    top?: number; // count of sticky items
    bottom?: number; // count of sticky items
    renderStickyTop?: (args: { items: readonly T[] }) => React.ReactNode;
    renderStickyBottom?: (args: { items: readonly T[] }) => React.ReactNode;
  };

  /** SSR fallback: render первых N элементов */
  ssr?: {
    count?: number;
  };

  /** Скролл-контейнер */
  scroll?: {
    /** controlled: внешний scrollTop/scrollLeft (редко нужно) */
    position?: { top?: number; left?: number };
    /** уведомления */
    onScroll?: (pos: { top: number; left: number }) => void;
    /** контейнер по умолчанию внутренний; можно подцепить внешний */
    containerRef?: React.RefObject<HTMLElement>;
  };

  /** События виртуализации */
  onRangeChange?: (range: { items: { start: number; end: number } }) => void;

  /** Отладка/расширения */
  className?: string;
  style?: React.CSSProperties;
};
```

**Экспорт:**

```ts
export function VirtualList<T>(props: VirtualListProps<T>): JSX.Element;
```

SSR fallback:

- На сервере рендерятся первые `ssr.count` элементов (без доступа к DOM).
- После гидрации происходит переход в режим измерений/виртуализации.
- `ssr.count` считается от начала списка и включает sticky-top элементы.

---

### `VirtualGrid`

2D виртуализация (строки + столбцы), основа для таблиц.

```ts
type VirtualGridProps<Cell> = {
  rowCount: number;
  columnCount: number;

  /** Ключ ячейки */
  cellKey?: (rowIndex: number, columnIndex: number) => React.Key;

  /** Рендер ячейки */
  renderCell: (args: { rowIndex: number; columnIndex: number }) => React.ReactNode;

  /** Конфигурация осей */
  rows: AxisConfig;
  columns: AxisConfig;

  /** Sticky зоны */
  sticky?: StickyGridConfig;

  /** SSR fallback: render первых N строк/колонок */
  ssr?: {
    rows?: number;
    columns?: number;
  };

  /** Окно рендера */
  overscan?: GridOverscan;

  /** Скролл/события */
  scroll?: ScrollConfig;
  onRangeChange?: (range: GridRange) => void;

  className?: string;
  style?: React.CSSProperties;
};
```

Где:

```ts
type AxisConfig = { sizeMode: 'fixed'; itemSize: number } | { sizeMode: 'dynamic'; estimatedItemSize: number };

type StickyGridConfig = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;

  /** Опциональные рендеры, если нужно отдельно управлять слоями */
  renderTopStickyRow?: (args: { rowIndex: number }) => React.ReactNode;
  renderBottomStickyRow?: (args: { rowIndex: number }) => React.ReactNode;
  renderLeftStickyColumn?: (args: { columnIndex: number }) => React.ReactNode;
  renderRightStickyColumn?: (args: { columnIndex: number }) => React.ReactNode;
  renderCorner?: (args: { corner: 'tl' | 'tr' | 'bl' | 'br' }) => React.ReactNode;
};

type GridOverscan =
  | number
  | {
      rows?: number | { before?: number; after?: number };
      columns?: number | { before?: number; after?: number };
    };

type ScrollConfig = {
  position?: { top?: number; left?: number };
  onScroll?: (pos: { top: number; left: number }) => void;
  containerRef?: React.RefObject<HTMLElement>;
};

type GridRange = {
  rows: { start: number; end: number };
  columns: { start: number; end: number };
};
```

**Экспорт:**

```ts
export function VirtualGrid(props: VirtualGridProps<unknown>): JSX.Element;
```

SSR fallback:

- На сервере рендерится `ssr.rows` x `ssr.columns` ячеек (без доступа к DOM).
- После гидрации происходит переход в режим измерений/виртуализации.
- `ssr.rows` и `ssr.columns` считаются от начала осей и включают sticky-top/left зоны.

---

### `VirtualTable` (опционально, как façade)

Если библиотека целится в UI-kit таблиц — удобный фасад над `VirtualGrid`:

```ts
type VirtualTableProps<Row> = {
  rows: readonly Row[];
  columns: readonly { id: string; title?: string }[];

  rowKey: (row: Row, rowIndex: number) => React.Key;

  renderHeaderCell?: (args: { columnId: string; columnIndex: number }) => React.ReactNode;
  renderBodyCell: (args: { row: Row; rowIndex: number; columnId: string; columnIndex: number }) => React.ReactNode;

  layout?: {
    rowHeight?: AxisConfig; // fixed/dynamic
    columnWidth?: AxisConfig; // fixed/dynamic
  };

  sticky?: { header?: boolean; leftColumns?: number };
  overscan?: GridOverscan;
  scroll?: ScrollConfig;

  onRangeChange?: (range: GridRange) => void;

  className?: string;
  style?: React.CSSProperties;
};
```

---

## 2) Imperative API (прокрутка к строке/ячейке)

Для компонентов — через `ref`.

```ts
type ScrollAlign = 'start' | 'center' | 'end' | 'nearest';
type ScrollBehavior = 'auto' | 'smooth';

type ScrollToIndexOptions = {
  align?: ScrollAlign;
  behavior?: ScrollBehavior;
  /** для dynamic: если false — не будет пытаться форсировать измерения */
  allowEstimate?: boolean;
};

export type VirtualListHandle = {
  scrollToIndex(index: number, options?: ScrollToIndexOptions): void;
  getScrollPosition(): { top: number; left: number };
  getVisibleRange(): { start: number; end: number };
  measure(): void; // форс пересчёт (resize / изменения контента)
};

export type VirtualGridHandle = {
  scrollToRow(rowIndex: number, options?: ScrollToIndexOptions): void;
  scrollToColumn(columnIndex: number, options?: ScrollToIndexOptions): void;
  scrollToCell(rowIndex: number, columnIndex: number, options?: ScrollToIndexOptions): void;

  getScrollPosition(): { top: number; left: number };
  getVisibleRange(): GridRange;
  measure(): void;
};
```

Компоненты:

```ts
export const VirtualList = React.forwardRef<VirtualListHandle, VirtualListProps<any>>(...)
export const VirtualGrid = React.forwardRef<VirtualGridHandle, VirtualGridProps<any>>(...)
```

---

## 3) Headless hooks (для кастомного UI)

Нужны для случаев, когда потребителю важно самому собирать DOM (например, интеграция с собственной Table разметкой).

### `useVirtualList`

```ts
type VirtualItem = { index: number; offset: number; size: number; key: React.Key };

export function useVirtualList<T>(args: {
  count: number;
  itemKey?: (index: number) => React.Key;
  viewportRef: React.RefObject<HTMLElement>;

  sizeMode: 'fixed' | 'dynamic';
  itemSize?: number;
  estimatedItemSize?: number;

  overscan?: number | { before?: number; after?: number };
  sticky?: { top?: number; bottom?: number };

  onRangeChange?: (range: { start: number; end: number }) => void;
}): {
  totalSize: number;
  items: VirtualItem[]; // только видимые (с overscan)
  offset: number; // offset первого элемента
  scrollToIndex: (index: number, options?: ScrollToIndexOptions) => void;

  /** динамические размеры: регистрация измерений */
  measureElement?: (index: number, el: HTMLElement | null) => void;

  /** текущее окно */
  range: { start: number; end: number };
};
```

### `useVirtualGrid`

```ts
type VirtualCell = {
  rowIndex: number;
  columnIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  key: React.Key;
};

export function useVirtualGrid(args: {
  rowCount: number;
  columnCount: number;
  viewportRef: React.RefObject<HTMLElement>;

  rows: AxisConfig;
  columns: AxisConfig;

  overscan?: GridOverscan;
  sticky?: { top?: number; bottom?: number; left?: number; right?: number };

  onRangeChange?: (range: GridRange) => void;
}): {
  totalWidth: number;
  totalHeight: number;

  cells: VirtualCell[];
  range: GridRange;

  scrollToCell: (rowIndex: number, columnIndex: number, options?: ScrollToIndexOptions) => void;
  scrollToRow: (rowIndex: number, options?: ScrollToIndexOptions) => void;
  scrollToColumn: (columnIndex: number, options?: ScrollToIndexOptions) => void;

  measureRowElement?: (rowIndex: number, el: HTMLElement | null) => void;
  measureColumnElement?: (columnIndex: number, el: HTMLElement | null) => void;
};
```

Примечание по sticky + dynamic: sticky-зоны измеряются отдельно через `ResizeObserver`, и в расчете viewport/range используются фактические sticky extents (top/bottom/left/right), а не только `estimatedItemSize`.

---

## 4) Публичные типы и утилиты

### Типы событий

```ts
export type Range1D = { start: number; end: number };
export type Range2D = { rows: Range1D; columns: Range1D };

export type ScrollPosition = { top: number; left: number };
```

### Конфигурации

```ts
export type Overscan1D = number | { before?: number; after?: number };
export type Overscan2D = GridOverscan;
export type AxisConfig = AxisConfig; // как выше
```

### Runtime guards (опционально)

```ts
export function clampIndex(index: number, count: number): number;
```

---

## 5) Экспортируемые entrypoints

Минимальный рекомендуемый набор:

```ts
// components
export { VirtualList } from './react/VirtualList';
export { VirtualGrid } from './react/VirtualGrid';
export { VirtualTable } from './react/VirtualTable'; // optional

// hooks (headless)
export { useVirtualList } from './react/hooks/useVirtualList';
export { useVirtualGrid } from './react/hooks/useVirtualGrid';

// types
export type {
  VirtualListProps,
  VirtualGridProps,
  VirtualListHandle,
  VirtualGridHandle,
  AxisConfig,
  ScrollToIndexOptions,
  Range1D,
  Range2D,
  ScrollPosition,
} from './shared/types';
```

---

## Ключевые решения по API (trade-offs)

1. **High-level компоненты + headless hooks**

- Даёт быстрый старт и гибкость интеграций.
- Избегает “одного компонента на все случаи”.

2. **Dynamic sizing — через explicit `estimatedItemSize`**

- Без этого API становится “магическим” и нестабильным.

3. **Sticky выделены в отдельную конфигурацию**

- Прямо отражает архитектурное решение ADR-001 (sticky — отдельные слои).
