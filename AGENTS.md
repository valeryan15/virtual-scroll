## Назначение

Этот файл описывает правила, контекст и архитектурные ограничения для **разработки библиотеки виртуального скролла**.
Все автоматизированные агенты (Codex, AI-ассистенты) и участники команды **обязаны** следовать данным инструкциям при генерации, изменении или анализе кода.

Цель — сохранить архитектурную целостность, предсказуемость API и долгосрочную устойчивость библиотеки.

---

## task tracking

Use 'bd' for task tracking

## правила ведения задач

1. Создать одноимённую ветку в git и перейти в нее.
2. Перевести задачу в статус in progress (bd).
3. Реализовать условия задачи.
4. Написать тесты, если необходимо напасить историю для Storybookю
5. Если всё выполнено — запустить проверки: yarn typecheck, yarn lint, yarn test
6. Если проверки прошли — сделать commit в git и закрыть задачу. Не нужно делать pull, pushСообщить, что нужно запушить изменения.

## Роль агента

Агент действует в роли:

> **Frontend Architect / Core UI Infrastructure Engineer**

Фокус:

- архитектура и алгоритмы виртуализации;
- масштабируемость и производительность;
- стабильность публичного API;
- соответствие принятым ADR.

Агент **не** выступает в роли продуктового дизайнера или бизнес-аналитика.

---

## 1) Основная цель (North Star)

- Отдавать приоритет **предсказуемым и инкрементальным изменениям**, а не большим рефакторингам.
- Проектировать решения с горизонтом **1–3 года поддержки**.
- Минимизировать архитектурный и технический долг.
- Использовать **TypeScript + React** как базовый стек.
- Учитывать **performance, надежность, observability и DX**.
- Архитектура — средство ускорения бизнеса, а не самоцель.

## 2) Правила безопасности (что можно / что нельзя)

### МОЖНО

- Перед началом работы прочитать:
  - `README.md`
  - `docs/`
  - `CONTRIBUTING.md`
  - `ARCHITECTURE.md` (если есть)
- Использовать `yarn` для установки зависимостей и запуска скриптов проекта.
- Делать **небольшие изменения** с понятным назначением.
- Добавлять или обновлять тесты при изменении поведения.
- Использовать **явные контракты** (типы, интерфейсы, props).
- Сохранять стабильность публичных API, если явно не указано иное.

### НЕЛЬЗЯ

- Переформатировать файлы без необходимости.
- Делать массовые lint-фиксы вне зоны изменений.
- Менять:
  - build-инфраструктуру
  - tsconfig
  - eslint / prettier
  - CI/CD
  - версии зависимостей
    без прямого запроса.
- Внедрять новые архитектурные паттерны, библиотеки или фреймворки без согласования.
- Использовать `any` / `@ts-ignore`, если есть разумная типизированная альтернатива
  (если нет — обязательно объяснить причину).

---

## 3) Как подходить к задаче

1. **Понять цель** — что именно должно измениться с точки зрения системы или пользователя.
2. **Найти код** — точки входа, владелец модуля, границы ответственности.
3. **Определить контракты**:
   - типы
   - props
   - API
   - события
   - data flow
4. Сформировать **минимальный план**:
   - какие файлы будут затронуты
   - что трогать нельзя
   - как будет проверяться результат
5. Реализовать решение с **минимальным радиусом влияния**.
6. Проверить результат (см. раздел 6).
7. Кратко описать изменения и возможные риски.

---

## 4) структуру репозитория

Этот документ объясняет **структуру репозитория библиотеки виртуального скролла** и фиксирует:

- назначение каждого каталога;
- допустимые типы изменений;
- границы ответственности;
- запреты для автоматизированных агентов.

Цель — предотвратить архитектурные нарушения и случайную деградацию core-логики.

---

## Общая схема репозитория

```
.
├── core/
│   ├── axis/
│   ├── size-index/
│   ├── range/
│   ├── anchor/
│   ├── utils/
│   └── __tests__/
│
├── react/
│   ├── components/
│   ├── hooks/
│   ├── internal/
│   └── __tests__/
│
├── shared/
│   ├── types/
│   ├── constants/
│   └── guards/
│
├── docs/
│   ├── adr/
│   ├── overview.md
│   └── api.md
│
├── codex/
│   └── rules/
│       └── virtualization.rules
│
├── scripts/
├── tests/
│
├── AGENTS.md
├── CONTRIBUTING.md
├── README.md
└── package.json
```

---

## core/ — Алгоритмы виртуализации (CRITICAL)

**Назначение:**
Чистая алгоритмическая часть виртуального скролла.
Это **самый критичный слой проекта**.

### core/axis/

```
core/axis/
├── fixedAxis.ts
├── dynamicAxis.ts
└── axis.types.ts
```

- Реализация `AxisModel`
- Логика расчёта диапазонов, offsets
- Fixed и Dynamic стратегии

✅ Разрешено:

- оптимизация алгоритмов;
- добавление новых стратегий (через ADR);
- рефакторинг без изменения семантики.

❌ Запрещено:

- зависимости от React, DOM, ResizeObserver;
- side-effects;
- линейные (`O(n)`) операции в hot-path.

---

### core/size-index/

```
core/size-index/
├── fenwickTree.ts
├── sizeIndex.ts
└── __tests__/
```

- Реализация Dynamic Size Index (ADR-005)
- Prefix sums, поиск по offset

❗ **Любые изменения здесь требуют unit-тестов.**

---

### core/range/

```
core/range/
├── rangeCalculator.ts
├── overscan.ts
└── range.types.ts
```

- Расчёт virtual window
- Overscan логика
- Clamp / edge cases

---

### core/anchor/

```
core/anchor/
├── anchorManager.ts
├── anchor.types.ts
└── __tests__/
```

- Scroll anchoring (ADR-003)
- Фиксация и восстановление позиции

❌ Запрещено:

- отключать anchoring для dynamic;
- прямые манипуляции scroll offset без anchor.

---

### core/utils/

- Математические и безопасные утилиты
- Без состояния и сайд-эффектов

---

### core/**tests**/

- Unit-тесты core-алгоритмов
- Запуск без DOM

---

## react/ — UI-адаптер (Adapter Layer)

**Назначение:**
Связь core-алгоритмов с React и DOM.

### react/components/

```
react/components/
├── VirtualList.tsx
├── VirtualGrid.tsx
├── VirtualTable.tsx
```

- High-level публичные компоненты
- Минимальная логика
- Делегирование в hooks + core

❌ Запрещено:

- дублировать алгоритмы core;
- хранить вычисления offsets/ranges локально.

---

### react/hooks/

```
react/hooks/
├── useVirtualList.ts
├── useVirtualGrid.ts
├── useScrollPosition.ts
└── useResizeObserver.ts
```

- Headless API (ADR-002)
- Интеграция core + DOM

✅ Разрешено:

- DOM measurement;
- batching;
- RAF-обновления.

---

### react/internal/

```
react/internal/
├── layers/
│   ├── StickyLayer.tsx
│   ├── VirtualBodyLayer.tsx
│   └── CornerLayer.tsx
├── context/
└── utils/
```

- Внутренние render-слои
- Sticky реализация (ADR-004)

❗ **Не экспортируется публично.**

---

### react/**tests**/

- Integration-тесты
- Scroll, sticky, dynamic, prepend

---

## shared/ — Общие контракты

```
shared/
├── types/
├── constants/
└── guards/
```

- Типы публичного API
- Общие интерфейсы
- Runtime-guards (clamp, invariant)

❌ Запрещено:

- бизнес-логика;
- React / DOM.

---

## docs/ — Архитектура и контракт

```
docs/
├── adr/
│   ├── adr-001-virtualization-architecture.md
│   ├── adr-002-public-api.md
│   ├── adr-003-scroll-anchoring.md
│   ├── adr-004-sticky-rows-columns.md
│   └── adr-005-dynamic-size-index-implementation.md
├── overview.md
├── functional-requirements.md
└── public-api.md
```

---

## codex/ — Политики AI-агентов

```
codex/
└── rules/
    └── virtualization.rules
```

- Execution policy для Codex CLI
- Запрещает destructive / unsafe операции

❗ Agents **обязаны** учитывать эти правила.

---

## scripts/ — Инфраструктура

- build
- test
- release
- lint

Агенты **не должны** менять scripts без явного запроса.

---

## tests/ — Сквозные тесты

- e2e / visual / perf (если есть)
- Не дублируют unit/integration

---

## Корневые файлы (обязательные к учёту)

| Файл            | Назначение                |
| --------------- | ------------------------- |
| AGENTS.md       | правила для агентов       |
| CONTRIBUTING.md | правила контрибьюции      |
| README.md       | входная точка             |
| package.json    | публичный контракт пакета |

---

## Главные запреты для agents (summary)

❌ Добавлять логику виртуализации вне `core`
❌ Делать `O(n)` операции в scroll-path
❌ Менять public API без ADR
❌ Смешивать sticky и virtual body
❌ Использовать DOM в core

---

## Ментальная модель для агента

> **core** — математика
> **react** — адаптер
> **shared** — контракты
> **docs** — истина
> **codex** — безопасность

---

## 5) Конвенции кодирования

### TypeScript

- Предпочитать `unknown` вместо `any`.
- Использовать discriminated unions для сложных состояний.
- Экспортируемые типы считать контрактом.
- Избегать чрезмерно сложных type-level конструкций без явной пользы.

### React

- Использовать функциональные компоненты и hooks.
- Минимизировать побочные эффекты.
- Асинхронную логику изолировать.
- Оптимизации (memo, useCallback) — только при необходимости.

### Стили

- Следовать существующему подходу (scss, css modules и т.д.).
- Не добавлять новые styling-библиотеки.

### Ошибки и наблюдаемость

- Возвращать осмысленные и безопасные для пользователя ошибки.
- Использовать только существующие механизмы логирования и метрик.

---

## Архитектурный контекст (обязательно к учёту)

Проект использует зафиксированные архитектурные решения:

- **ADR-001** — Virtualization Architecture
- **ADR-002** — Public API
- **ADR-003** — Scroll Anchoring
- **ADR-004** — Sticky Rows & Columns
- **ADR-005** — Dynamic Size Index Implementation

❗ Любые изменения, противоречащие ADR, **запрещены** без явного обновления соответствующего ADR.

---

## Базовые принципы разработки

### 1. Core ≠ UI

- Алгоритмы виртуализации **не зависят** от React.
- React-слой — адаптер, а не источник логики.
- Core должен быть тестируем без DOM.

### 2. 1D и 2D — единая модель

- List = Grid с одной колонкой.
- Запрещено писать отдельные алгоритмы для List и Grid, если их можно обобщить через оси.

### 3. Fixed и Dynamic — разные стратегии

- Fixed size — приоритетный и оптимальный путь.
- Dynamic size — только при явной необходимости.
- Нельзя смешивать стратегии в одном AxisModel.

### 4. Никакой «магии»

- `estimatedItemSize` обязателен для dynamic.
- Авто-угадывание размеров запрещено.
- Все нестабильные места должны быть задокументированы.

---

## Границы ответственности

| Слой     | Ответственность                       | Запрещено            |
| -------- | ------------------------------------- | -------------------- |
| core     | расчёт диапазонов, offsets, anchoring | DOM, React           |
| react    | рендер, refs, ResizeObserver          | алгоритмы            |
| consumer | данные, UI-логика                     | вмешательство в core |

---

## Публичный API: правила изменения

### Разрешено

- добавление новых пропсов с дефолтным поведением;
- расширение конфигураций;
- добавление новых компонентов/хуков.

### Запрещено

- изменение сигнатур существующих API;
- изменение семантики `scrollToIndex`;
- утечка внутренних структур (`AxisModel`, `SizeIndex`).

Любое потенциальное breaking-изменение:

- оформляется как ADR;
- попадает только в **major** релиз.

---

## Scroll и стабильность (критично)

Агент обязан учитывать:

- scroll anchoring **всегда включён** для dynamic;
- prepend данных **всегда стабилизирован**;
- sticky элементы **никогда не участвуют в виртуализации**;
- scrollTop / scrollLeft — источник истины.

Запрещено:

- напрямую модифицировать scroll без anchoring;
- полагаться на browser native anchoring.

---

## Sticky Rows & Columns

- Sticky — отдельные render-слои.
- Sticky не входят в AxisModel.
- Corner-зоны — самостоятельные контейнеры.
- CSS `position: sticky` **не используется** как основной механизм.

---

## Dynamic Size Index

- Используется Fenwick Tree (или эквивалент).
- Все операции:
  - `getOffset`
  - `findIndexByOffset`
  - `setSize`
    должны быть `O(log n)`.

Запрещено:

- линейные проходы по массивам размеров;
- пересчёт offsets целиком при каждом update.

---

## Производительность

Агент обязан:

- избегать layout thrashing;
- использовать `requestAnimationFrame` для scroll-апдейтов;
- батчить измерения (`ResizeObserver`);
- держать число DOM-нод в viewport ограниченным.

---

## Тестирование (обязательно)

### Unit

- AxisModel
- SizeIndex
- findIndexByOffset
- scroll anchoring расчёты

### Integration

- dynamic size + images
- prepend без scroll jump
- scrollToIndex до и после измерений
- sticky + virtualization

### Запрещено

- принимать изменения без тестов для core-логики.

---

## Стиль кода

- TypeScript строго типизирован.
- Явные интерфейсы вместо implicit shape.
- Минимум side-effects.
- Комментарии — только для архитектурных решений, не для очевидного кода.

---

## Non-Goals (агент НЕ должен пытаться)

- реализовывать masonry / free-layout;
- добавлять бизнес-фичи (sorting, filtering);
- оптимизировать prematurely без измерений;
- «упрощать» архитектуру за счёт потери инвариантов.

---

## Процесс изменений

1. Изменение поведения → **ADR**.
2. Изменение API → **ADR + migration path**.
3. Оптимизация → **benchmark + justification**.

---

## Итоговое правило

> **Если решение упрощает код, но усложняет архитектурные гарантии — оно запрещено.**

Архитектура библиотеки — инструмент долгосрочной стабильности, а не краткосрочной скорости.

---

Если хочешь, следующим шагом могу:

- подготовить **rules-файл для codex cli** под этот AGENTS.md;
- сделать **checklist code review** для PR в библиотеку;
- или оформить **CONTRIBUTING.md**, согласованный с этим документом.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
