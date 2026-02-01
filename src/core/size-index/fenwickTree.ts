export class FenwickTree {
  private readonly tree: number[];
  private readonly lsb: number[];
  private readonly size: number;

  constructor(size: number) {
    this.size = Math.max(0, size);
    this.tree = new Array(this.size + 1).fill(0);
    this.lsb = new Array(this.size + 1).fill(0);

    for (let i = 1; i <= this.size; i += 1) {
      let value = 1;
      let temp = i;
      while (temp % 2 === 0) {
        value *= 2;
        temp /= 2;
      }
      this.lsb[i] = value;
    }
  }

  build(values: number[]): void {
    const length = Math.min(values.length, this.size);

    for (let i = 1; i <= this.size; i += 1) {
      this.tree[i] = i <= length ? values[i - 1] ?? 0 : 0;
    }

    for (let i = 1; i <= this.size; i += 1) {
      const parent = i + this.lsb[i];
      if (parent <= this.size) {
        this.tree[parent] += this.tree[i];
      }
    }
  }

  add(index: number, delta: number): void {
    for (let i = index + 1; i <= this.size; i += this.lsb[i]) {
      this.tree[i] += delta;
    }
  }

  prefixSum(endIndex: number): number {
    let result = 0;
    for (let i = endIndex; i > 0; i -= this.lsb[i]) {
      result += this.tree[i];
    }
    return result;
  }

  findIndexByPrefixSum(target: number): number {
    let idx = 0;
    let bit = 1;

    while (bit * 2 <= this.size) {
      bit *= 2;
    }

    let sum = 0;
    while (bit !== 0) {
      const next = idx + bit;
      if (next <= this.size && sum + this.tree[next] <= target) {
        sum += this.tree[next];
        idx = next;
      }
      bit = Math.floor(bit / 2);
    }

    return idx;
  }
}
