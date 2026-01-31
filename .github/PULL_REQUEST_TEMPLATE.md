<!--
Спасибо за вклад в библиотеку виртуального скролла.

Перед созданием PR:
- ознакомьтесь с AGENTS.md
- убедитесь, что изменения соответствуют ADR-001…ADR-005
- используйте docs/code-review-checklist.md как источник истины
-->

# Краткое описание

<!-- Что изменено и зачем. 2–5 предложений. -->
<!-- Если это фикс бага — опишите воспроизведение. -->

---

## Тип изменений

Отметьте один или несколько вариантов:

- [ ] feat — новая функциональность
- [ ] fix — исправление бага
- [ ] refactor — рефакторинг без изменения поведения
- [ ] perf — оптимизация производительности
- [ ] docs — документация
- [ ] test — тесты
- [ ] chore — инфраструктура / tooling

---

## Связанные задачи / ADR

<!-- Укажите ссылки -->
- Issue:
- ADR:
  - [ ] ADR-001 (Architecture)
  - [ ] ADR-002 (Public API)
  - [ ] ADR-003 (Scroll Anchoring)
  - [ ] ADR-004 (Sticky Rows & Columns)
  - [ ] ADR-005 (Dynamic Size Index)

---

## Затронутые области

Отметьте применимые пункты:

- [ ] Core (алгоритмы виртуализации)
- [ ] React layer (components / hooks)
- [ ] Public API
- [ ] Dynamic size
- [ ] Sticky rows / columns
- [ ] Scroll anchoring
- [ ] Tests
- [ ] Docs / Storybook

---

## Архитектурная самопроверка (обязательно)

### ADR-инварианты

- [ ] Core-логика не зависит от React / DOM (ADR-001)
- [ ] Public API не ломается и не расширяется без необходимости (ADR-002)
- [ ] Scroll anchoring сохранён для dynamic / prepend сценариев (ADR-003)
- [ ] Sticky элементы не участвуют в виртуализации (ADR-004)
- [ ] В dynamic hot-path нет O(n) операций (ADR-005)

---

## Производительность

- [ ] Нет O(n) операций в scroll / resize / range calculation
- [ ] Нет layout thrashing (read → write без батчинга)
- [ ] Количество DOM-нод ограничено viewport + overscan
- [ ] Измерения размеров батчатся (ResizeObserver / RAF)

---

## Стабильность скролла (UX)

- [ ] Нет scroll jump при:
  - [ ] late-measure (изображения, async контент)
  - [ ] prepend данных
  - [ ] resize viewport
- [ ] scrollToIndex / scrollToCell работает в fixed и dynamic
- [ ] Sticky синхронизирован с обеими осями скролла

---

## Edge cases

- [ ] count = 0 / пустые данные
- [ ] scroll за пределы totalSize (clamp)
- [ ] некорректные размеры (0 / NaN)
- [ ] быстрый скролл без “пустых дыр”

---

## Тесты

### Unit
- [ ] AxisModel / range calculation
- [ ] Dynamic Size Index (prefix sums, findIndexByOffset)
- [ ] Scroll anchoring расчёты

### Integration
- [ ] dynamic size + late-measure
- [ ] prepend без scroll jump
- [ ] sticky + virtual body
- [ ] scrollToIndex / scrollToCell

---

## Документация

- [ ] README / Overview обновлены (если нужно)
- [ ] Storybook Docs / stories обновлены (если затронут UI)
- [ ] Поведение/ограничения описаны явно

---

## Breaking changes / Migration

- [ ] Нет breaking changes
- [ ] Есть breaking changes (описать ниже и указать migration path)

<!--
Опишите:
- что ломается
- кого затрагивает
- как мигрировать
-->

---

## Checklist (финальный)

- [ ] PR соответствует docs/code-review-checklist.md
- [ ] Все пункты выше проверены автором
- [ ] Изменения готовы к ревью

<!--
PR без выполнения архитектурных инвариантов может быть отклонён.
-->
