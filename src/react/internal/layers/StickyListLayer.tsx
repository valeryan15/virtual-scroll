import type { CSSProperties, ReactNode } from 'react';

type StickyListLayerProps = {
  position: 'top' | 'bottom';
  size: number;
  scrollOffsetX: number;
  scrollOffsetY: number;
  children: ReactNode;
};

export function StickyListLayer({ position, size, scrollOffsetX, scrollOffsetY, children }: StickyListLayerProps) {
  if (size <= 0) {
    return null;
  }

  const style: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    [position]: 0,
    height: size,
    pointerEvents: 'none',
    zIndex: 2,
    willChange: 'transform',
    transform: `translate3d(${scrollOffsetX}px, ${scrollOffsetY}px, 0)`,
  };

  return (
    <div
      data-virtual-layer={`sticky-${position}`}
      style={style}
    >
      <div style={{ pointerEvents: 'auto', height: '100%' }}>{children}</div>
    </div>
  );
}
