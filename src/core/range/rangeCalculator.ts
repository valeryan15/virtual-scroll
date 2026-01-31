import type { VirtualRange } from './range.types';

type FixedRangeInput = {
  viewportOffset: number;
  viewportSize: number;
  itemSize: number;
  count: number;
};

export function calculateFixedRange({
  viewportOffset,
  viewportSize,
  itemSize,
  count,
}: FixedRangeInput): VirtualRange {
  const safeItemSize = Number.isFinite(itemSize) ? itemSize : 0;
  const safeViewportSize = Number.isFinite(viewportSize) ? viewportSize : 0;
  const safeViewportOffset = Number.isFinite(viewportOffset) ? viewportOffset : 0;

  if (count <= 0 || safeItemSize <= 0 || safeViewportSize <= 0) {
    return { start: 0, end: 0, offset: 0 };
  }

  const totalSize = count * safeItemSize;
  const clampedOffset = Math.min(Math.max(0, safeViewportOffset), totalSize);
  const baseStart = Math.floor(clampedOffset / safeItemSize);
  const start = Math.min(Math.max(baseStart, 0), count - 1);
  const visibleCount = Math.ceil(safeViewportSize / safeItemSize);
  const end = Math.min(count, start + visibleCount);

  return { start, end, offset: start * safeItemSize };
}
