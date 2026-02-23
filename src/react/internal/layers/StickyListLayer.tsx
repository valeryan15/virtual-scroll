import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';

type StickyListLayerProps = {
  position: 'top' | 'bottom';
  size?: number;
  scrollOffsetX: number;
  scrollOffsetY: number;
  children: ReactNode;
  contentRef?: (element: HTMLDivElement | null) => void;
  viewportRef?: RefObject<HTMLElement | null>;
};

export function StickyListLayer({
  position,
  size,
  scrollOffsetX,
  scrollOffsetY,
  children,
  contentRef,
  viewportRef,
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

  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const viewport = viewportRef?.current;
    if (!layer || !viewport) {
      return;
    }

    const syncTransform = () => {
      layer.style.transform = `translate3d(${viewport.scrollLeft}px, ${viewport.scrollTop}px, 0)`;
    };

    syncTransform();
    viewport.addEventListener('scroll', syncTransform, { passive: true });

    return () => {
      viewport.removeEventListener('scroll', syncTransform);
    };
  }, [viewportRef]);

  return (
    <div
      ref={layerRef}
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
