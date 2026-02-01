import { createSizeIndex } from './sizeIndex';

describe('SizeIndex', () => {
  it('initializes with estimated sizes and computes offsets', () => {
    const index = createSizeIndex({ count: 3, estimatedItemSize: 10 });

    expect(index.totalSize).toBe(30);
    expect(index.getOffset(0)).toBe(0);
    expect(index.getOffset(1)).toBe(10);
    expect(index.getOffset(3)).toBe(30);
    expect(index.findIndexByOffset(0)).toBe(0);
    expect(index.findIndexByOffset(9)).toBe(0);
    expect(index.findIndexByOffset(10)).toBe(1);
    expect(index.findIndexByOffset(29)).toBe(2);
    expect(index.findIndexByOffset(30)).toBe(2);
  });

  it('updates sizes and keeps O(log n) access paths', () => {
    const index = createSizeIndex({ count: 3, estimatedItemSize: 10 });

    index.setSize(1, 20);

    expect(index.totalSize).toBe(40);
    expect(index.getOffset(2)).toBe(30);
    expect(index.findIndexByOffset(15)).toBe(1);
    expect(index.findIndexByOffset(35)).toBe(2);
  });
});
