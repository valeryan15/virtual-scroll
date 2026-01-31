import { calculateFixedRange } from './rangeCalculator';

describe('calculateFixedRange', () => {
  it('calculates base range for viewport start', () => {
    const range = calculateFixedRange({
      viewportOffset: 0,
      viewportSize: 100,
      itemSize: 20,
      count: 10,
    });

    expect(range).toEqual({ start: 0, end: 5, offset: 0 });
  });

  it('calculates range for mid-scroll offset', () => {
    const range = calculateFixedRange({
      viewportOffset: 30,
      viewportSize: 100,
      itemSize: 20,
      count: 10,
    });

    expect(range).toEqual({ start: 1, end: 6, offset: 20 });
  });

  it('clamps to last item when offset exceeds total size', () => {
    const range = calculateFixedRange({
      viewportOffset: 1000,
      viewportSize: 50,
      itemSize: 10,
      count: 10,
    });

    expect(range).toEqual({ start: 9, end: 10, offset: 90 });
  });
});
