export type ListItem = {
  id: number;
  label: string;
};

export const createListItems = (count: number): ListItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    label: `Item ${index + 1}`,
  }));

export const getListItemHeight = (index: number): number => 28 + (index % 5) * 8;

export const getRowHeight = (rowIndex: number): number => 32 + (rowIndex % 4) * 10;

export const getColumnWidth = (columnIndex: number): number => 80 + (columnIndex % 3) * 20;

export const formatCellLabel = (rowIndex: number, columnIndex: number): string =>
  `R${rowIndex + 1} C${columnIndex + 1}`;
