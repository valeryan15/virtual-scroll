# @valeryan15/virtual-scroll

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

### Установка пакета из npm

```bash
npm install @valeryan15/virtual-scroll
```

или

```bash
yarn add @valeryan15/virtual-scroll
```

Страница пакета: `https://www.npmjs.com/package/@valeryan15/virtual-scroll`

### Установка проекта для локальной разработки

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
yarn run test:e2e
yarn run storybook
yarn run changeset
yarn run version-packages
yarn run release
```

## Публикация в npm

- Версионирование и changelog управляются через Changesets.
- Для изменений, которые должны попасть в релиз, создайте changeset:

```bash
yarn changeset
```

- Публикация запускается workflow `Release` после merge в `main`.
- Рекомендуемый способ публикации: npm Trusted Publishing (GitHub OIDC), без хранения `NPM_TOKEN`.
- Если Trusted Publishing не используется, добавьте `NPM_TOKEN` в GitHub: `Settings -> Secrets and variables -> Actions -> Repository secrets`.

## Husky

```bash
npm run prepare
chmod +x .husky/pre-commit
```
