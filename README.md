# virtual-scroll

React + TypeScript библиотека для рендеринга больших списков с виртуализацией.

## Возможности

- Виртуализация списка фиксированной высоты элементов.
- Конфигурируемые размеры контейнера.
- Overscan для более плавного скролла.
- Storybook для документации и Vitest для тестов.
- Prettier для форматирования, TSLint для lint-проверок, Husky для git-хуков.

## Документация

- Обзор и архитектура: `docs/overview.md`
- Публичный API: `docs/public-api.md`
- ADR: `docs/adr/`

## Установка

```bash
nvm use
yarn install
```

`nvm use` использует версию из `.nvmrc`.

## Скрипты

```bash
yarn run dev
yarn run build
yarn run lint
yarn run format
yarn run format:check
yarn run test
yarn run storybook
```

## Husky

```bash
npm run prepare
chmod +x .husky/pre-commit
```
