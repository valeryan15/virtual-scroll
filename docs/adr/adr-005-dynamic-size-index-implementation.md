# ADR-005: Dynamic Size Index Implementation

**Статус:** Accepted
**Дата:** 2026-01-31
**Контекст проекта:** Библиотека виртуального скролла
**Связанные ADR:**

* ADR-001: Virtualization Architecture
* ADR-002: Public API
* ADR-003: Scroll Anchoring
* ADR-004: Sticky Rows & Columns

---

## Context

Библиотека виртуального скролла поддерживает режимы с **динамическими размерами строк и столбцов**, при которых:

* фактический размер элемента неизвестен до рендера;
* размеры могут меняться со временем (изображения, expand/collapse);
* требуется программная прокрутка к элементу (`scrollToIndex`);
* необходимо определять виртуальный диапазон по `scrollTop / scrollLeft`.

Для этих задач требуется структура данных, способная эффективно отвечать на запросы:

1. Какой суммарный offset до элемента с индексом *i*?
2. Какой индекс соответствует заданному scroll offset?
3. Как обновить размер элемента после измерения?

---

## Problem

Наивные решения (массив размеров + линейный проход):

* имеют сложность `O(n)` при поиске индекса по offset;
* не масштабируются для больших списков (10k+ элементов);
* делают scroll и resize нестабильными;
* усложняют scroll anchoring и scrollToIndex.

Также необходимо учитывать:

* частые обновления размеров;
* независимость осей (строки / столбцы);
* совместимость с fixed-size стратегией.

---

## Decision

Для dynamic-size виртуализации используется **Size Index** — внутренняя структура данных, основанная на **префиксных суммах** и поддерживающая логарифмические операции.

---

### 1. Контракт Size Index

Фиксируется следующий интерфейс:

```ts
interface SizeIndex {
  /** Общее количество элементов */
  count: number;

  /** Общая виртуальная длина */
  totalSize: number;

  /** Получить размер элемента */
  getSize(index: number): number;

  /** Установить измеренный размер */
  setSize(index: number, size: number): void;

  /** Получить offset до элемента */
  getOffset(index: number): number;

  /** Найти индекс по scroll offset */
  findIndexByOffset(offset: number): number;
}
```

Контракт:

* одинаков для строк и столбцов;
* используется `AxisModel` (ADR-001);
* не экспонируется как public API (ADR-002).

---

### 2. Выбор структуры данных

В качестве базовой реализации выбран **Fenwick Tree (Binary Indexed Tree)**.

#### Причины выбора:

* `O(log n)` на обновление и запрос;
* компактная реализация;
* подходит для динамических обновлений;
* проще в реализации и поддержке, чем Segment Tree.

Segment Tree рассматривался как альтернатива, но отклонён из-за:

* более высокой сложности;
* избыточности для операций суммы.

---

### 3. Работа с измеренными и оценочными размерами

Для каждого элемента:

* до измерения используется `estimatedItemSize`;
* после измерения размер фиксируется через `setSize`;
* изменение размера обновляет дерево префиксных сумм.

```ts
actualSize = measuredSize ?? estimatedItemSize;
```

**Важно:**

* `estimatedItemSize` обязателен для dynamic-режима;
* библиотека не пытается вычислять оценки автоматически.

---

### 4. Поиск индекса по offset

Для вычисления `startIndex` при скролле:

* используется `findIndexByOffset(scrollOffset)`;
* операция выполняется за `O(log n)`;
* возвращается первый индекс, для которого:

```
prefixSum(index) >= scrollOffset
```

Это используется в:

* расчёте `VirtualRange`;
* `scrollToIndex`;
* scroll anchoring (ADR-003).

---

### 5. Интеграция с AxisModel

`DynamicAxisModel` делегирует всю работу с размерами в `SizeIndex`:

```ts
class DynamicAxisModel {
  sizeIndex: SizeIndex;

  getOffsetByIndex(i) {
    return sizeIndex.getOffset(i);
  }

  getRange(offset, viewportSize) {
    const start = sizeIndex.findIndexByOffset(offset);
    const end = sizeIndex.findIndexByOffset(offset + viewportSize);
    return { start, end, offset: sizeIndex.getOffset(start) };
  }
}
```

Это позволяет:

* сохранить единый контракт AxisModel;
* прозрачно комбинировать fixed и dynamic оси.

---

### 6. Обновление размеров (measurement pipeline)

Обновление размеров происходит через следующий пайплайн:

1. DOM-элемент измеряется (`ResizeObserver` / ref).
2. Новый размер сравнивается со старым.
3. При изменении:

   * вызывается `setSize(index, newSize)`;
   * пересчитывается `totalSize`;
   * активируется scroll anchoring (ADR-003).
4. Выполняется один батч-апдейт диапазона.

**Правило:**
Несколько измерений в одном frame агрегируются.

---

### 7. Поведение при prepend / data mutation

* При prepend элементов:

  * SizeIndex инициализируется новыми элементами;
  * существующие размеры сдвигаются по индексам;
  * anchoring удерживает позицию пользователя.

* При удалении элементов:

  * соответствующие узлы исключаются;
  * `totalSize` корректируется.

---

### 8. Ограничения и защитные меры

* `findIndexByOffset` всегда возвращает индекс в `[0, count - 1]`.
* Offset < 0 → индекс 0.
* Offset > totalSize → последний индекс.
* При некорректных измерениях (0 / NaN):

  * используется fallback `estimatedItemSize`.

---

## Consequences

### Положительные

* Масштабируемость для больших списков и таблиц.
* Предсказуемая сложность операций.
* Корректная поддержка dynamic size.
* Единая модель для строк и столбцов.
* Надёжная база для scroll anchoring.

---

### Отрицательные / Trade-offs

* Увеличение сложности core-алгоритмов.
* Дополнительные структуры данных в памяти.
* Estimated size может вызывать неточность до измерений.

---

## Alternatives Considered

### 1. Линейный массив размеров

❌ `O(n)` при каждом скролле.

### 2. Segment Tree

⚠️ Возможен, но избыточен для текущих операций.

### 3. Полный пересчёт offsets

❌ Неприемлемо для больших данных.

---

## Non-Goals

* Экспорт SizeIndex как public API.
* Автоматическое угадывание размеров элементов.
* Поддержка non-linear layout (masonry).

---

## Testing Strategy

* Unit:

  * корректность prefix sums;
  * findIndexByOffset для граничных случаев.
* Integration:

  * dynamic list с изображениями;
  * scrollToIndex до и после измерений;
  * prepend данных без scroll jump.
* Performance:

  * стресс-тесты на 50k–100k элементов.

---

## Follow-ups

* Документировать ограничения dynamic-size в Storybook Docs.
* Добавить визуальные тесты для late-measure кейсов.
* Возможное расширение SizeIndex для batch-инициализации.
