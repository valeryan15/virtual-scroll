export class FenwickTree {
  private readonly tree: number[];
  private readonly size: number;

  constructor(size: number) {
    this.size = Math.max(0, size);
    this.tree = new Array(this.size + 1).fill(0);
  }

  build(values: number[]): void {
    const length = Math.min(values.length, this.size);

    for (let i = 1; i <= this.size; i += 1) {
      this.tree[i] = i <= length ? values[i - 1] ?? 0 : 0;
    }

    for (let i = 1; i <= this.size; i += 1) {
      const parent = i + (i & -i);
      if (parent <= this.size) {
        this.tree[parent] += this.tree[i];
      }
    }
  }

  add(index: number, delta: number): void {
    for (let i = index + 1; i <= this.size; i += i & -i) {
      this.tree[i] += delta;
    }
  }

  prefixSum(endIndex: number): number {
    let result = 0;
    for (let i = endIndex; i > 0; i -= i & -i) {
      result += this.tree[i];
    }
    return result;
  }

  findIndexByPrefixSum(target: number): number {
    let idx = 0;
    let bit = 1;

    while (bit << 1 <= this.size) {
      bit <<= 1;
    }

    let sum = 0;
    while (bit !== 0) {
      const next = idx + bit;
      if (next <= this.size && sum + this.tree[next] <= target) {
        sum += this.tree[next];
        idx = next;
      }
      bit >>= 1;
    }

    return idx;
  }
}
