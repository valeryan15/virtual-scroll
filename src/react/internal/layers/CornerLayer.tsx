import type { CSSProperties, ReactNode } from 'react';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

type CornerLayerProps = {
  corner: Corner;
  width: number;
  height: number;
  scrollOffsetX?: number;
  scrollOffsetY?: number;
  render: (args: { corner: Corner }) => ReactNode;
};

const baseCornerStyle: CSSProperties = {
  position: 'absolute',
  pointerEvents: 'none',
  zIndex: 3,
};

export function CornerLayer({ corner, width, height, scrollOffsetX, scrollOffsetY, render }: CornerLayerProps) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const style: CSSProperties = {
    ...baseCornerStyle,
    width,
    height,
    top: corner.startsWith('t') ? 0 : undefined,
    bottom: corner.startsWith('b') ? 0 : undefined,
    left: corner.endsWith('l') ? 0 : undefined,
    right: corner.endsWith('r') ? 0 : undefined,
    transform: `translate(${scrollOffsetX ?? 0}px, ${scrollOffsetY ?? 0}px)`,
  };

  return (
    <div data-virtual-layer={`corner-${corner}`} style={style}>
      <div style={{ pointerEvents: 'auto', height: '100%' }}>{render({ corner })}</div>
    </div>
  );
}
