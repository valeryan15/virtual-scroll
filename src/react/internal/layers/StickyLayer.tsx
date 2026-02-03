import type { CSSProperties, ReactNode } from 'react';

export type StickyItem = {
  index: number;
  offset: number;
  size: number;
};

type StickyLayerProps = {
  orientation: 'row' | 'column';
  position: 'start' | 'end';
  items: readonly StickyItem[];
  scrollOffsetX: number;
  scrollOffsetY: number;
  render: (args: { index: number }) => ReactNode;
};

const baseLayerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 2,
};

export function StickyLayer({ orientation, position, items, scrollOffsetX, scrollOffsetY, render }: StickyLayerProps) {
  if (items.length === 0) {
    return null;
  }

  const isRow = orientation === 'row';
  const translate = `translate(${scrollOffsetX}px, ${scrollOffsetY}px)`;

  return (
    <div data-virtual-layer="sticky" style={baseLayerStyle}>
      {items.map((item) => {
        const itemStyle: CSSProperties = isRow
          ? {
              position: 'absolute',
              left: 0,
              right: 0,
              height: item.size,
              [position === 'start' ? 'top' : 'bottom']: item.offset,
              transform: translate,
            }
          : {
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: item.size,
              [position === 'start' ? 'left' : 'right']: item.offset,
              transform: translate,
            };

        return (
          <div key={`${position}-${item.index}`} style={itemStyle}>
            <div style={{ pointerEvents: 'auto', height: '100%' }}>{render({ index: item.index })}</div>
          </div>
        );
      })}
    </div>
  );
}
