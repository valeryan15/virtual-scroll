import type { AxisModel } from './axis.types';
import { calculateFixedRange } from '../range/rangeCalculator';
import { applyOverscan } from '../range/overscan';

export type FixedAxisConfig = {
  count: number;
  itemSize: number;
  overscan?: number;
};

export function createFixedAxisModel({ count, itemSize, overscan = 1 }: FixedAxisConfig): AxisModel {
  const safeCount = Math.max(0, count);
  const safeItemSize = Number.isFinite(itemSize) ? itemSize : 0;

  const getOffsetByIndex = (index: number) => {
    if (safeCount === 0 || safeItemSize <= 0) {
      return 0;
    }

    const clamped = Math.min(Math.max(index, 0), safeCount);
    return clamped * safeItemSize;
  };

  const getRange: AxisModel['getRange'] = (viewportOffset, viewportSize, overscanOverride) => {
    const baseRange = calculateFixedRange({
      viewportOffset,
      viewportSize,
      itemSize: safeItemSize,
      count: safeCount,
    });

    return applyOverscan({
      range: baseRange,
      overscan: overscanOverride ?? overscan,
      count: safeCount,
      getOffsetByIndex,
    });
  };

  return {
    count: safeCount,
    totalSize: safeCount * Math.max(0, safeItemSize),
    getRange,
    getOffsetByIndex,
  };
}
