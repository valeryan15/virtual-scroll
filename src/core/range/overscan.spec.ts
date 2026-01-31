import { applyOverscan } from './overscan';

describe('applyOverscan', () => {
  it('expands range and clamps to bounds', () => {
    const range = { start: 2, end: 5, offset: 20 };
    const getOffsetByIndex = (index: number) => index * 10;

    const result = applyOverscan({
      range,
      overscan: 2,
      count: 6,
      getOffsetByIndex,
    });

    expect(result).toEqual({ start: 0, end: 6, offset: 0 });
  });

  it('normalizes overscan to at least 1', () => {
    const range = { start: 3, end: 4, offset: 30 };
    const getOffsetByIndex = (index: number) => index * 10;

    const result = applyOverscan({
      range,
      overscan: 0,
      count: 10,
      getOffsetByIndex,
    });

    expect(result).toEqual({ start: 2, end: 5, offset: 20 });
  });
});
