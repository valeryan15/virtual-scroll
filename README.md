# virtual-scroll

React + TypeScript библиотека для рендеринга больших списков с виртуализацией.

## Возможности

- Виртуализация списка фиксированной высоты элементов.
- Конфигурируемые размеры контейнера.
- Overscan для более плавного скролла.
- Storybook для документации и Jest для тестов.
- Prettier для форматирования, TSLint для lint-проверок, Husky для git-хуков.

## Документация

- Обзор и архитектура: `docs/overview.md`
- Публичный API: `docs/public-api.md`
- ADR: `docs/adr/`

## Установка

```bash
nvm use
npm install
```

`nvm use` использует версию из `.nvmrc`.

## Скрипты

```bash
npm run dev
npm run build
npm run lint
npm run format
npm run format:check
npm run test
npm run storybook
```

## Husky

```bash
npm run prepare
chmod +x .husky/pre-commit
```

## Использование

```tsx
import { VirtualScroll } from "virtual-scroll";

const items = Array.from({ length: 1000 }, (_, index) => (
  <div key={index} style={{ height: 40 }}>
    Row {index + 1}
  </div>
));

export function Example() {
  return (
    <VirtualScroll
      items={items}
      itemHeight={40}
      height={320}
      overscan={3}
    />
  );
}
```
