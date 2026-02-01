import { createDynamicAxisModel } from './dynamicAxis';

describe('createDynamicAxisModel', () => {
  it('calculates range using estimated sizes and overscan', () => {
    const axis = createDynamicAxisModel({ count: 5, estimatedItemSize: 10, overscan: 1 });

    const range = axis.getRange(0, 25);

    expect(range).toEqual({ start: 0, end: 4, offset: 0 });
  });

  it('reacts to measured size updates', () => {
    const axis = createDynamicAxisModel({ count: 5, estimatedItemSize: 10, overscan: 1 });

    axis.setSize(0, 30);

    const range = axis.getRange(0, 25);

    expect(range).toEqual({ start: 0, end: 2, offset: 0 });
  });
});
