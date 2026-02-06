export type ListItem = {
  id: number;
  label: string;
};

export type StoryLocale = 'ru' | 'en';

export const resolveStoryLocale = (locale: unknown): StoryLocale => (locale === 'en' ? 'en' : 'ru');

export const createListItems = (count: number, locale: StoryLocale): ListItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    label: locale === 'ru' ? `Элемент ${index + 1}` : `Item ${index + 1}`,
  }));

export const getListItemHeight = (index: number): number => 28 + (index % 5) * 8;

export const getRowHeight = (rowIndex: number): number => 32 + (rowIndex % 4) * 10;

export const getColumnWidth = (columnIndex: number): number => 80 + (columnIndex % 3) * 20;

export const formatCellLabel = (rowIndex: number, columnIndex: number, locale: StoryLocale): string =>
  locale === 'ru' ? `Стр ${rowIndex + 1}, Кол ${columnIndex + 1}` : `R${rowIndex + 1} C${columnIndex + 1}`;

export const storyText = {
  sticky: (locale: StoryLocale): string => (locale === 'ru' ? 'закреплено' : 'sticky'),
  scrollTop: (locale: StoryLocale): string => (locale === 'ru' ? 'Прокрутка сверху' : 'ScrollTop'),
  scroll: (locale: StoryLocale): string => (locale === 'ru' ? 'Прокрутка' : 'Scroll'),
  header: (locale: StoryLocale, index: number): string => (locale === 'ru' ? `Заголовок ${index}` : `Header ${index}`),
  column: (locale: StoryLocale, index: number): string => (locale === 'ru' ? `Колонка ${index}` : `Col ${index}`),
  ssrDescription: (locale: StoryLocale): string =>
    locale === 'ru'
      ? 'Укажите ssr.count, чтобы отрисовать первые N элементов на сервере до гидратации.'
      : 'Set ssr.count to render the first N items on the server before hydration.',
};
