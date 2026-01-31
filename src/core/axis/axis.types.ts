export type { VirtualRange } from '../range/range.types';

export interface AxisModel {
  count: number;
  totalSize: number;
  getRange(viewportOffset: number, viewportSize: number, overscan?: number): VirtualRange;
  getOffsetByIndex(index: number): number;
}
