import type { AnchorApplyInput, AnchorCaptureInput, ScrollAnchor } from './anchor.types';

export type AnchorManager = {
  capture: (input: AnchorCaptureInput) => ScrollAnchor | null;
  apply: (anchor: ScrollAnchor | null, input: AnchorApplyInput) => number;
  shift: (anchor: ScrollAnchor | null, delta: number, count: number) => ScrollAnchor | null;
};

const clampIndex = (index: number, count: number) => {
  if (count <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), count - 1);
};

export function createAnchorManager(): AnchorManager {
  const capture = ({ scrollOffset, rangeStart, count, getOffsetByIndex }: AnchorCaptureInput) => {
    if (count <= 0) {
      return null;
    }

    const safeRangeStart = clampIndex(Math.floor(rangeStart), count);
    const safeScrollOffset = Number.isFinite(scrollOffset) ? scrollOffset : 0;
    const baseOffset = getOffsetByIndex(safeRangeStart);

    return {
      index: safeRangeStart,
      offsetInItem: safeScrollOffset - baseOffset,
    };
  };

  const apply = (anchor: ScrollAnchor | null, { count, getOffsetByIndex }: AnchorApplyInput) => {
    if (!anchor || count <= 0) {
      return 0;
    }

    const safeIndex = clampIndex(anchor.index, count);
    return getOffsetByIndex(safeIndex) + anchor.offsetInItem;
  };

  const shift = (anchor: ScrollAnchor | null, delta: number, count: number) => {
    if (!anchor || count <= 0) {
      return null;
    }

    const safeDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
    return {
      ...anchor,
      index: clampIndex(anchor.index + safeDelta, count),
    };
  };

  return {
    capture,
    apply,
    shift,
  };
}
