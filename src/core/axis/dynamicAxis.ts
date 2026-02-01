import type { AxisModel } from './axis.types';
import { applyOverscan } from '../range/overscan';
import type { SizeIndex } from '../size-index/sizeIndex';
import { createSizeIndex } from '../size-index/sizeIndex';

export type DynamicAxisConfig = {
  count: number;
  estimatedItemSize: number;
  overscan?: number;
};

export type DynamicAxisModel = AxisModel & {
  sizeIndex: SizeIndex;
  getSize: (index: number) => number;
  setSize: (index: number, size: number) => void;
};

export function createDynamicAxisModel({ count, estimatedItemSize, overscan = 1 }: DynamicAxisConfig): DynamicAxisModel {
  const safeCount = Math.max(0, count);
  const sizeIndex = createSizeIndex({ count: safeCount, estimatedItemSize });

  const getOffsetByIndex = (index: number) => sizeIndex.getOffset(index);

  const getRange: AxisModel['getRange'] = (viewportOffset, viewportSize, overscanOverride) => {
    if (safeCount === 0) {
      return { start: 0, end: 0, offset: 0 };
    }

    const safeViewportOffset = Number.isFinite(viewportOffset) ? viewportOffset : 0;
    const safeViewportSize = Number.isFinite(viewportSize) ? viewportSize : 0;

    if (safeViewportSize <= 0) {
      return { start: 0, end: 0, offset: 0 };
    }

    const clampedOffset = Math.max(0, safeViewportOffset);
    const startIndex = sizeIndex.findIndexByOffset(clampedOffset);
    const endIndex = sizeIndex.findIndexByOffset(clampedOffset + safeViewportSize);
    const baseRange = {
      start: Math.min(Math.max(0, startIndex), safeCount - 1),
      end: Math.min(safeCount, endIndex + 1),
      offset: sizeIndex.getOffset(startIndex),
    };

    return applyOverscan({
      range: baseRange,
      overscan: overscanOverride ?? overscan,
      count: safeCount,
      getOffsetByIndex,
    });
  };

  return {
    count: safeCount,
    get totalSize() {
      return sizeIndex.totalSize;
    },
    getRange,
    getOffsetByIndex,
    sizeIndex,
    getSize: sizeIndex.getSize,
    setSize: sizeIndex.setSize,
  };
}
