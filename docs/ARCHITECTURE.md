# Архитектура библиотеки виртуального скролла

## 1. Краткое резюме

Библиотека виртуального скролла — это инфраструктурный слой UI, предназначенный для эффективного отображения больших двумерных и одномерных коллекций данных (списки, таблицы, гриды) с минимальным количеством DOM-нод.

Поддерживаемые сценарии:

- виртуализация строк и/или столбцов;
- фиксированные (sticky) строки и столбцы;
- динамические размеры элементов;
- программная прокрутка к заданному индексу.

Статус: **новая библиотека / базовая архитектура**.

---

## 2. Архитектурные цели и принципы

### Цели

- Предсказуемая производительность при десятках и сотнях тысяч элементов.
- Масштабируемость API (список → таблица → грид).
- Отделение алгоритмов виртуализации от UI-рендера.
- Возможность расширения без ломки API.

### Принципы

- **Алгоритмы ≠ React**: вся математика вынесена в core.
- **1D как частный случай 2D**.
- **Fixed и dynamic — разные стратегии**, но общий контракт.
- **Scroll — источник истины**, DOM вторичен.
- **Без скрытой магии**: все нестабильные моменты (оценки, пересчёты) явно описаны.

---

## 3. Концептуальная модель

### 3.1 Координатная модель

Вся сцена описывается в координатах:

- Ось Y — строки
- Ось X — столбцы

Любой список = `columns = 1`
Любая таблица = `rows × columns`

---

### 3.2 Основные сущности

#### Viewport

```ts
interface Viewport {
  width: number;
  height: number;
  scrollTop: number;
  scrollLeft: number;
}
```

#### VirtualRange

```ts
interface VirtualRange {
  start: number;
  end: number;
  offset: number; // px
}
```

#### AxisModel (ось строк или столбцов)

```ts
interface AxisModel {
  count: number;
  totalSize: number;
  getRange(viewportOffset: number, viewportSize: number): VirtualRange;
  getOffsetByIndex(index: number): number;
}
```

---

## 4. Стратегии виртуализации

### 4.1 Fixed-size стратегия

Используется, если размер строки/столбца известен заранее и постоянен.

**Формулы:**

- `index = floor(scrollOffset / itemSize)`
- `offset = index * itemSize`
- `totalSize = count * itemSize`

**Свойства:**

- O(1) вычисления
- нулевая нестабильность
- предпочтительная стратегия по умолчанию

---

### 4.2 Dynamic-size стратегия

Используется при переменной высоте строк или ширине столбцов.

#### Внутренняя модель

- `measuredSize[index]`
- `estimatedSize` (fallback)
- структура префиксных сумм

```ts
interface SizeIndex {
  getSize(index: number): number;
  setSize(index: number, size: number): void;
  getOffset(index: number): number;
  findIndexByOffset(offset: number): number;
}
```

Реализация:

- Fenwick Tree / Segment Tree
- `O(log n)` на обновление и поиск

---

## 5. Фиксированные (sticky) строки и столбцы

### 5.1 Модель слоёв

```
┌───────────────────────────────┐
│ Fixed Header (rows)           │
├───────────────┬───────────────┤
│ Fixed Columns │ Virtual Body  │
├───────────────┴───────────────┤
│ (optional) Footer             │
└───────────────────────────────┘
```

### 5.2 Архитектурное решение

- Фиксированные строки/столбцы **не виртуализируются**.
- Для них создаются отдельные render-слои.
- Основное виртуальное тело компенсирует их размер через offset.

```ts
interface StickyConfig {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}
```

---

## 6. Scroll anchoring (стабилизация)

### Назначение

Предотвращение скачков при:

- догрузке данных;
- измерении динамических размеров;
- prepend строк.

### Механизм

1. Выбирается якорная строка:
   - `anchorIndex`
   - `offsetInItem`

2. После перерасчёта размеров:
   - вычисляется новый offset
   - корректируется scrollTop / scrollLeft

---

## 7. Структура библиотеки

```
/core
  axis/
    fixedAxis.ts
    dynamicAxis.ts
  sizeIndex/
  rangeCalculator.ts
  anchorManager.ts

/react
  VirtualViewport.tsx
  VirtualList.tsx
  VirtualGrid.tsx
  hooks/
    useVirtualAxis.ts
    useScrollPosition.ts

/shared
  types.ts
  constants.ts
```

---

## 8. Границы ответственности

| Компонент   | Делает            | Не делает               |
| ----------- | ----------------- | ----------------------- |
| core        | расчёт диапазонов | рендер                  |
| react-layer | рендер DOM        | бизнес-логика           |
| consumer    | данные            | алгоритмы виртуализации |

---

## 9. Риски и решения

| Риск                | Мера                           |
| ------------------- | ------------------------------ |
| Scroll jump         | anchor-based коррекция         |
| Медленные измерения | батчинг + ResizeObserver       |
| API перегрузка      | layered API (low / high level) |

---

## 10. План развития

1. 1D VirtualList (fixed)
2. 1D VirtualList (dynamic)
3. VirtualGrid
4. Sticky rows / columns
5. ScrollToIndex API
6. Оптимизации (RAF, batching)
