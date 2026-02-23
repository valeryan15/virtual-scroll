import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

type CornerLayerProps = {
  corner: Corner;
  width: number;
  height: number;
  scrollOffsetX?: number;
  scrollOffsetY?: number;
  render: (args: { corner: Corner }) => ReactNode;
  viewportRef?: RefObject<HTMLElement | null>;
};

const baseCornerStyle: CSSProperties = {
  position: 'absolute',
  pointerEvents: 'none',
  zIndex: 3,
  willChange: 'transform',
};

export function CornerLayer({
  corner,
  width,
  height,
  scrollOffsetX,
  scrollOffsetY,
  render,
  viewportRef,
}: CornerLayerProps) {
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
    transform: `translate3d(${scrollOffsetX ?? 0}px, ${scrollOffsetY ?? 0}px, 0)`,
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
      data-virtual-layer={`corner-${corner}`}
      style={style}
    >
      <div style={{ pointerEvents: 'auto', height: '100%' }}>{render({ corner })}</div>
    </div>
  );
}
