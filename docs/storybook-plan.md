# План Storybook: примеры и документация

Цель: добавить примеры использования `VirtualList`/`VirtualGrid` через Storybook и предоставить полную документацию библиотеки в Storybook Docs, без изменений tooling и зависимостей.

## Область
- Компоненты: `VirtualList`, `VirtualGrid` (и опционально `VirtualTable`, если появится).
- Хуки: опциональные docs‑примеры в MDX или stories (если экспортируются).
- Фокус: паттерны использования, edge‑cases и documented trade‑offs из ADR.

## Ограничения
- Нельзя менять build/CI tooling, tsconfig, eslint/prettier, версии зависимостей.
- Использовать текущий Storybook (`.storybook/main.ts`, `addon-essentials`, autodocs tags).
- Держать изменения минимальными и предсказуемыми.

## Результаты
1. Storybook stories для `VirtualList` и `VirtualGrid` с интерактивными контролами.
2. Storybook Docs страницы, включающие:
   - API overview и таблицы пропсов (autodocs).
   - Usage‑примеры (fixed/dynamic, sticky, overscan, controlled scroll).
   - Примечания по поведению (scroll anchoring, динамические размеры, SSR fallback).
3. MDX‑доки обязательны: отдельные MDX‑страницы для полноценной документации библиотеки.
4. Общие demo‑данные/хелперы для консистентности между stories.

## План реализации

### 1) Структура Storybook
- Создать `src/react/stories/` (или `src/stories/`) для stories:
  - `VirtualList.stories.tsx`
  - `VirtualGrid.stories.tsx`
  - Обязательные MDX‑доки (например, `Virtualization.docs.mdx`).
- Убедиться, что stories попадают под текущий glob: `src/**/*.stories.@(ts|tsx)`.

### 2) Общие demo‑хелперы
- Добавить небольшой helper‑модуль с demo‑данными:
  - `src/react/stories/storyData.ts` (или `src/stories/storyData.ts`).
  - Дать массивы items, генератор variable‑height контента, рендер ячеек.
- Хелперы должны быть чистыми, без DOM‑доступа.

### 3) Stories для VirtualList
Минимальный, но полный набор:
- `BasicFixed`: fixed size список с контролами overscan.
- `DynamicMeasured`: dynamic список с `estimatedItemSize` и разной высотой контента.
- `StickyHeaderFooter`: sticky top/bottom для демонстрации слоёв.
- `ControlledScroll`: `scroll.position` и `onScroll` для controlled‑режима.
- `SsrFallback`: демонстрация `ssr.count` + заметка о переходе после гидрации.

### 4) Stories для VirtualGrid
Ключевые сценарии:
- `BasicFixedGrid`: fixed rows/columns.
- `DynamicRows`: dynamic rows с fixed columns (или наоборот).
- `StickyRowsColumns`: sticky top row / left column и corner‑render.
- `ControlledScrollGrid`: controlled scroll position.

### 5) Контент Docs (Storybook Docs)
- Использовать autodocs tags для таблиц пропсов.
- MDX‑доки обязательны для:
  - Обзора архитектуры (core vs react adapter).
  - Anchoring‑поведения и стабильности prepend.
  - Ограничений dynamic‑режима и необходимости `estimatedItemSize`.
  - SSR fallback (`ssr.count`, `ssr.rows/columns`).
- Ссылки на ADR упоминать в notes/комментариях при описании поведения.

### 6) Визуальная подача (минимально)
- Единый контейнер‑стиль для всех stories:
  - Фиксированная высота/ширина viewport.
  - Фон и grid‑lines через простой inline CSS.
- Не добавлять новые стилевые библиотеки.

### 7) Проверки и QA (лёгкий режим)
- Новые unit‑тесты для stories не нужны.
- Запустить `yarn storybook` и убедиться, что stories рендерятся.
- Опционально: smoke‑lint для stories, если уже есть инфраструктура.

## Карта файлов (ожидаемо)
- `src/react/stories/VirtualList.stories.tsx`
- `src/react/stories/VirtualGrid.stories.tsx`
- `src/react/stories/storyData.ts`
- `src/react/stories/Virtualization.docs.mdx` (обязательно)

## Чек‑лист верификации
- Storybook стартует без ошибок.
- Все stories рендерятся и корректно скроллятся.
- Dynamic stories обновляются после измерений (без неожиданных jumps).
- Sticky‑слои в правильном порядке.
- SSR story корректно описывает поведение.
- MDX‑доки отображаются в Storybook Docs.

## Открытые вопросы
- Предпочтительное место stories (`src/react/stories` vs `src/stories`)?
- Нужен ли placeholder для `VirtualTable` (если добавится позже)?
