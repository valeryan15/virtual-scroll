# virtual-scroll

React + TypeScript библиотека для рендеринга больших списков с виртуализацией.

## Возможности

- Виртуализация списка фиксированной высоты элементов.
- Конфигурируемые размеры контейнера.
- Overscan для более плавного скролла.
- Storybook для документации и Jest для тестов.

## Установка

```bash
npm install
```

## Скрипты

```bash
npm run dev
npm run build
npm run test
npm run storybook
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
