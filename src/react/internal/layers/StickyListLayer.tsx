import type { CSSProperties, ReactNode } from 'react';

type StickyListLayerProps = {
  position: 'top' | 'bottom';
  size?: number;
  scrollOffsetX: number;
  scrollOffsetY: number;
  children: ReactNode;
  contentRef?: (element: HTMLDivElement | null) => void;
};

export function StickyListLayer({
  position,
  size,
  scrollOffsetX,
  scrollOffsetY,
  children,
  contentRef,
}: StickyListLayerProps) {
  if (typeof size === 'number' && size <= 0) {
    return null;
  }

  const style: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    [position]: 0,
    ...(typeof size === 'number' ? { height: size } : {}),
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
      <div
        ref={contentRef}
        style={{ pointerEvents: 'auto', ...(typeof size === 'number' ? { height: '100%' } : {}) }}
      >
        {children}
      </div>
    </div>
  );
}
