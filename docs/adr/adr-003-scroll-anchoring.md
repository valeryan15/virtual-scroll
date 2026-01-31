# ADR-003: Scroll Anchoring

**Статус:** Accepted
**Дата:** 2026-01-31
**Контекст проекта:** Библиотека виртуального скролла
**Связанные ADR:**

- ADR-001: Virtualization Architecture
- ADR-002: Public API

---

## Context

В библиотеке виртуального скролла поддерживаются:

- динамические размеры строк и столбцов;
- догрузка данных (append / prepend);
- измерение размеров после рендера (late-measure);
- программная прокрутка (`scrollToIndex`, `scrollToCell`).

Во всех этих сценариях происходит изменение:

- общей виртуальной длины (`totalSize`);
- смещений элементов (`offset`);
- диапазона виртуализации.

Без дополнительной стабилизации это приводит к **скачкам скролла (scroll jump)** — визуально пользователь «теряет» позицию, хотя логически остаётся в том же месте списка.

---

## Problem

Нативный браузерный scroll anchoring:

- работает только для реального DOM-контента;
- не учитывает виртуализацию и искусственные offsets;
- не способен корректно обработать prepend данных и пересчёт размеров.

В результате:

- при изменении размеров элементов viewport «прыгает»;
- при prepend пользователь теряет текущий контекст;
- программный `scrollToIndex` становится нестабильным;
- UX деградирует при работе с динамическими данными (чаты, ленты, карточки).

---

## Decision

В библиотеке реализуется **явный anchor-based механизм стабилизации скролла**, управляемый на уровне core-алгоритмов и используемый всеми режимами виртуализации.

---

### 1. Понятие якоря (Anchor)

Якорь описывает логическую позицию пользователя в виртуальном контенте:

```ts
interface ScrollAnchor {
  axis: 'vertical' | 'horizontal';
  index: number;
  offsetInItem: number; // px
}
```

Где:

- `index` — индекс элемента (строки / столбца);
- `offsetInItem` — расстояние от начала элемента до текущего scroll position.

---

### 2. Выбор якорного элемента

По умолчанию якорем является:

- **первый видимый элемент** в текущем virtual range.

Дополнительно:

- если активен `scrollToIndex`, якорь фиксируется на целевом элементе;
- sticky элементы **не могут быть якорем**.

---

### 3. Жизненный цикл anchoring

#### 3.1 Фиксация якоря (before update)

Перед операциями, способными изменить offsets:

- измерение размеров;
- изменение данных;
- prepend / append;
- resize viewport;

сохраняется:

```ts
anchor.index;
anchor.offsetInItem = scrollOffset - getOffsetByIndex(anchor.index);
```

---

#### 3.2 Пересчёт модели

- обновляются размеры элементов;
- пересчитывается `totalSize`;
- пересчитываются prefix sums / offsets.

---

#### 3.3 Восстановление позиции (after update)

После пересчёта вычисляется новое смещение:

```ts
newScrollOffset = getOffsetByIndex(anchor.index) + anchor.offsetInItem;
```

И применяется:

- `scrollTop` для вертикали;
- `scrollLeft` для горизонтали.

---

### 4. Область применения anchoring

Anchoring **обязателен** в следующих сценариях:

| Сценарий          | Причина                        |
| ----------------- | ------------------------------ |
| Dynamic size      | размеры меняются после рендера |
| Prepend данных    | индексы смещаются              |
| Image loading     | late-measure                   |
| Expand / collapse | изменение высоты               |
| scrollToIndex     | стабилизация целевого элемента |

---

### 5. Поведение при prepend / append

#### Append

- anchoring не требуется, если пользователь вверху;
- если пользователь внизу — якорь удерживает позицию.

#### Prepend

- anchoring **всегда активен**;
- якорь позволяет сохранить текущую строку в viewport.

---

### 6. Ограничения и fallback-логика

- Если `anchor.index` выходит за пределы массива:
  - применяется `clampIndex`.

- Если элемент ещё не измерен:
  - используется `estimatedItemSize`.

- При больших расхождениях:
  - допускается одноразовая коррекция без анимации.

---

### 7. Интеграция с API (ADR-002)

Anchoring используется внутри:

- `scrollToIndex`
- `scrollToRow / scrollToColumn / scrollToCell`
- `measure()`
- `useVirtualList / useVirtualGrid`

**Публично anchoring не экспонируется**, но его поведение является частью контрактов API.

---

## Consequences

### Положительные

- Отсутствие scroll jump’ов в динамических сценариях.
- Предсказуемое поведение при prepend данных.
- Стабильная программная прокрутка.
- UX, сопоставимый с нативными scroll-решениями.

---

### Отрицательные / Trade-offs

- Усложнение core-алгоритмов.
- Дополнительные вычисления при каждом update.
- Более сложное тестирование (нужно проверять визуальную стабильность).

---

## Alternatives Considered

### 1. Reliance on native browser anchoring

❌ Не работает с виртуализацией.

### 2. Полное игнорирование anchoring

❌ Недопустимо для dynamic-size и prepend сценариев.

### 3. Anchoring только для prepend

❌ Не решает проблему late-measure и resize.

---

## Non-Goals

- Не предоставляется публичный API управления якорем.
- Не гарантируется pixel-perfect стабильность при экстремально неточных `estimatedItemSize`.
- Не решается проблема логической навигации (focus management).

---

## Testing Strategy

- Unit-тесты: корректность пересчёта offsets.
- Integration-тесты:
  - prepend без scroll jump;
  - image load внутри viewport;
  - scrollToIndex в dynamic-режиме.

- Regression: сравнение scrollTop до/после update.

---

## Follow-ups

- ADR-004: Sticky Rows & Columns Rendering
- ADR-005: Dynamic Size Index Implementation
- Документация anchoring-поведения в Storybook Docs
