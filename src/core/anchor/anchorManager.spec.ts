import { createAnchorManager } from './anchorManager';

describe('anchorManager', () => {
  it('captures anchor from range start and preserves offset', () => {
    const manager = createAnchorManager();
    const getOffsetByIndex = (index: number) => index * 10;

    const anchor = manager.capture({
      scrollOffset: 35,
      rangeStart: 3,
      count: 10,
      getOffsetByIndex,
    });

    expect(anchor).toEqual({ index: 3, offsetInItem: 5 });
  });

  it('applies anchor after size changes', () => {
    const manager = createAnchorManager();
    const anchor = { index: 3, offsetInItem: 5 };
    const getOffsetByIndex = (index: number) => index * 12;

    const newOffset = manager.apply(anchor, { count: 10, getOffsetByIndex });

    expect(newOffset).toBe(41);
  });

  it('shifts anchor on prepend and clamps', () => {
    const manager = createAnchorManager();
    const anchor = { index: 2, offsetInItem: 4 };

    const shifted = manager.shift(anchor, 3, 6);

    expect(shifted).toEqual({ index: 5, offsetInItem: 4 });
  });

  it('clamps anchor index when applying to smaller dataset', () => {
    const manager = createAnchorManager();
    const anchor = { index: 10, offsetInItem: 2 };
    const getOffsetByIndex = (index: number) => index * 5;

    const newOffset = manager.apply(anchor, { count: 3, getOffsetByIndex });

    expect(newOffset).toBe(10 + 2);
  });

  it('returns null anchor when count is zero', () => {
    const manager = createAnchorManager();
    const getOffsetByIndex = (_index: number) => 0;

    const anchor = manager.capture({
      scrollOffset: 0,
      rangeStart: 0,
      count: 0,
      getOffsetByIndex,
    });

    expect(anchor).toBeNull();
  });
});
