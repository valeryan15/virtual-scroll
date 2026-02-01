export type ScrollAnchor = {
  index: number;
  offsetInItem: number;
};

export type AnchorCaptureInput = {
  scrollOffset: number;
  rangeStart: number;
  count: number;
  getOffsetByIndex: (index: number) => number;
};

export type AnchorApplyInput = {
  count: number;
  getOffsetByIndex: (index: number) => number;
};
