import { FenwickTree } from './fenwickTree';

export interface SizeIndex {
  count: number;
  totalSize: number;
  getSize(index: number): number;
  setSize(index: number, size: number): void;
  getOffset(index: number): number;
  findIndexByOffset(offset: number): number;
}

export type SizeIndexConfig = {
  count: number;
  estimatedItemSize: number;
};

export function createSizeIndex({ count, estimatedItemSize }: SizeIndexConfig): SizeIndex {
  const safeCount = Math.max(0, count);
  const safeEstimatedSize = Number.isFinite(estimatedItemSize) ? Math.max(0, estimatedItemSize) : 0;
  const sizes = new Array(safeCount).fill(safeEstimatedSize);
  const tree = new FenwickTree(safeCount);

  if (safeCount > 0) {
    tree.build(sizes);
  }

  let totalSize = safeCount * safeEstimatedSize;

  const getSize = (index: number) => {
    if (index < 0 || index >= safeCount) {
      return 0;
    }

    return sizes[index];
  };

  const setSize = (index: number, size: number) => {
    if (index < 0 || index >= safeCount) {
      return;
    }

    const safeSize = Number.isFinite(size) ? Math.max(0, size) : 0;
    const prevSize = sizes[index];
    if (prevSize === safeSize) {
      return;
    }

    sizes[index] = safeSize;
    const delta = safeSize - prevSize;
    tree.add(index, delta);
    totalSize += delta;
  };

  const getOffset = (index: number) => {
    if (safeCount === 0) {
      return 0;
    }

    const safeIndex = Math.min(Math.max(0, Math.floor(index)), safeCount);
    return tree.prefixSum(safeIndex);
  };

  const findIndexByOffset = (offset: number) => {
    if (safeCount === 0) {
      return 0;
    }

    const safeOffset = Number.isFinite(offset) ? offset : 0;
    if (safeOffset <= 0) {
      return 0;
    }

    if (safeOffset >= totalSize) {
      return safeCount - 1;
    }

    const index = tree.findIndexByPrefixSum(safeOffset);
    return Math.min(Math.max(0, index), safeCount - 1);
  };

  return {
    count: safeCount,
    get totalSize() {
      return totalSize;
    },
    getSize,
    setSize,
    getOffset,
    findIndexByOffset,
  };
}
