export type Range1D = {
  start: number;
  end: number;
};

export type Range2D = {
  rows: Range1D;
  columns: Range1D;
};

export type ScrollPosition = {
  top: number;
  left: number;
};

export type Overscan1D =
  | number
  | {
      before?: number;
      after?: number;
    };

export type GridOverscan =
  | number
  | {
      rows?: Overscan1D;
      columns?: Overscan1D;
    };

export type Overscan2D = GridOverscan;

export type AxisConfig = { sizeMode: 'fixed'; itemSize: number } | { sizeMode: 'dynamic'; estimatedItemSize: number };

export type GridRange = {
  rows: Range1D;
  columns: Range1D;
};

export type ScrollAlign = 'start' | 'center' | 'end' | 'nearest';

export type ScrollBehavior = 'auto' | 'smooth';

export type ScrollToIndexOptions = {
  align?: ScrollAlign;
  behavior?: ScrollBehavior;
  allowEstimate?: boolean;
};
