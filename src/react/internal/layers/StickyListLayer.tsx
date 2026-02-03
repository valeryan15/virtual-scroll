import type { CSSProperties, ReactNode } from 'react';

type StickyListLayerProps = {
  position: 'top' | 'bottom';
  size: number;
  scrollOffset: number;
  scrollAxis: 'x' | 'y';
  children: ReactNode;
};

export function StickyListLayer({ position, size, scrollOffset, scrollAxis, children }: StickyListLayerProps) {
  if (size <= 0) {
    return null;
  }

  const translate = scrollAxis === 'y' ? `translateY(${scrollOffset}px)` : `translateX(${scrollOffset}px)`;
  const style: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    [position]: 0,
    height: size,
    pointerEvents: 'none',
    zIndex: 2,
    transform: translate,
  };

  return (
    <div data-virtual-layer={`sticky-${position}`} style={style}>
      <div style={{ pointerEvents: 'auto', height: '100%' }}>{children}</div>
    </div>
  );
}
