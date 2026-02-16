export type ListItem = {
  id: number;
  label: string;
};

export type ChatMessage = {
  id: number;
  author: string;
  text: string;
  direction: 'incoming' | 'outgoing';
  time: string;
};

export type TileRow = {
  id: number;
  title: string;
  tiles: string[];
};

export type StoryLocale = 'ru' | 'en';

export const resolveStoryLocale = (locale: unknown): StoryLocale => (locale === 'en' ? 'en' : 'ru');

export const createListItems = (count: number, locale: StoryLocale): ListItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    label: locale === 'ru' ? `Элемент ${index + 1}` : `Item ${index + 1}`,
  }));

const pseudoRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const pickBySeed = <T>(values: readonly T[], seed: number): T => values[Math.floor(pseudoRandom(seed) * values.length)];

const formatChatTime = (index: number): string => {
  const hour = 9 + Math.floor(index / 12);
  const minute = (index * 5) % 60;
  const normalizedHour = String(hour % 24).padStart(2, '0');
  const normalizedMinute = String(minute).padStart(2, '0');
  return `${normalizedHour}:${normalizedMinute}`;
};

const russianWords = [
  'виртуализация',
  'скролл',
  'измерение',
  'список',
  'якорь',
  'обновление',
  'пакет',
  'сообщение',
  'рендер',
  'стабильность',
] as const;

const englishWords = [
  'virtualization',
  'scroll',
  'measurement',
  'list',
  'anchor',
  'update',
  'batch',
  'message',
  'render',
  'stability',
] as const;

const buildMessageText = (index: number, locale: StoryLocale): string => {
  const words = locale === 'ru' ? russianWords : englishWords;
  const length = 6 + Math.floor(pseudoRandom(index + 1) * 28);
  const content = Array.from({ length }, (_, wordIndex) => pickBySeed(words, index * 37 + wordIndex * 11)).join(' ');
  return `${content}.`;
};

export const createChatMessages = (count: number, locale: StoryLocale): ChatMessage[] => {
  const incomingLabel = locale === 'ru' ? 'Собеседник' : 'Teammate';
  const outgoingLabel = locale === 'ru' ? 'Вы' : 'You';

  return Array.from({ length: count }, (_, index) => {
    const direction = index % 3 === 0 ? 'outgoing' : 'incoming';
    return {
      id: index,
      author: direction === 'incoming' ? incomingLabel : outgoingLabel,
      direction,
      text: buildMessageText(index + 17, locale),
      time: formatChatTime(index),
    };
  });
};

export const createTileRows = (count: number, locale: StoryLocale): TileRow[] => {
  const baseLabel = locale === 'ru' ? 'Строка' : 'Row';
  const tilePrefix = locale === 'ru' ? 'Плитка' : 'Tile';

  return Array.from({ length: count }, (_unusedRow, rowIndex) => {
    const tileCount = 2 + Math.floor(pseudoRandom(rowIndex + 41) * 10);
    return {
      id: rowIndex,
      title: `${baseLabel} ${rowIndex + 1}`,
      tiles: Array.from(
        { length: tileCount },
        (_unusedTile, tileIndex) => `${tilePrefix} ${rowIndex + 1}-${tileIndex + 1}`,
      ),
    };
  });
};

export const getListItemHeight = (index: number): number => 28 + (index % 5) * 8;

export const getRowHeight = (rowIndex: number): number => 32 + (rowIndex % 4) * 10;

export const getColumnWidth = (columnIndex: number): number => 80 + (columnIndex % 3) * 20;

export const formatCellLabel = (rowIndex: number, columnIndex: number, locale: StoryLocale): string =>
  locale === 'ru' ? `Стр ${rowIndex + 1}, Кол ${columnIndex + 1}` : `R${rowIndex + 1} C${columnIndex + 1}`;

export const storyText = {
  sticky: (locale: StoryLocale): string => (locale === 'ru' ? 'закреплено' : 'sticky'),
  scrollTop: (locale: StoryLocale): string => (locale === 'ru' ? 'Прокрутка сверху' : 'ScrollTop'),
  scroll: (locale: StoryLocale): string => (locale === 'ru' ? 'Прокрутка' : 'Scroll'),
  chatStoryDescription: (locale: StoryLocale): string =>
    locale === 'ru'
      ? 'Длинный чат с сообщениями переменной высоты для проверки динамических измерений и стабильности скролла.'
      : 'Long chat feed with variable message heights to validate dynamic measurements and stable scrolling.',
  tilesStoryDescription: (locale: StoryLocale): string =>
    locale === 'ru'
      ? 'Большой список строк, где в каждой строке случайное количество небольших плиток.'
      : 'Large list of rows where each row contains a random number of small tiles.',
  header: (locale: StoryLocale, index: number): string => (locale === 'ru' ? `Заголовок ${index}` : `Header ${index}`),
  column: (locale: StoryLocale, index: number): string => (locale === 'ru' ? `Колонка ${index}` : `Col ${index}`),
  ssrDescription: (locale: StoryLocale): string =>
    locale === 'ru'
      ? 'Укажите ssr.count, чтобы отрисовать первые N элементов на сервере до гидратации.'
      : 'Set ssr.count to render the first N items on the server before hydration.',
};
