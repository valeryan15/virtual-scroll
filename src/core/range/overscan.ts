import type { VirtualRange } from './range.types';

type OverscanInput = {
  range: VirtualRange;
  overscan: number;
  count: number;
  getOffsetByIndex: (index: number) => number;
};

export function applyOverscan({
  range,
  overscan,
  count,
  getOffsetByIndex,
}: OverscanInput): VirtualRange {
  if (count <= 0) {
    return { start: 0, end: 0, offset: 0 };
  }

  const normalizedOverscan = Number.isFinite(overscan) ? Math.floor(overscan) : 1;
  const safeOverscan = Math.max(1, normalizedOverscan);
  const start = Math.max(0, range.start - safeOverscan);
  const end = Math.min(count, range.end + safeOverscan);

  return {
    start,
    end,
    offset: getOffsetByIndex(start),
  };
}
