import { useCallback, useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { useResizeObserver } from '../../hooks/useResizeObserver';

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
  onMeasureItem?: (args: { index: number; size: number }) => void;
  viewportRef?: RefObject<HTMLElement | null>;
};

const baseLayerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 2,
  willChange: 'transform',
};

export function StickyLayer({
  orientation,
  position,
  items,
  scrollOffsetX,
  scrollOffsetY,
  render,
  onMeasureItem,
  viewportRef,
}: StickyLayerProps) {
  if (items.length === 0) {
    return null;
  }

  const isRow = orientation === 'row';
  const layerStyle: CSSProperties = {
    ...baseLayerStyle,
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

  const measureItem = useCallback(
    (index: number, size: number) => {
      if (!onMeasureItem) {
        return;
      }
      onMeasureItem({ index, size: Math.max(0, size) });
    },
    [onMeasureItem],
  );

  return (
    <div
      ref={layerRef}
      data-virtual-layer='sticky'
      style={layerStyle}
    >
      {items.map((item) => {
        const itemStyle: CSSProperties = isRow
          ? {
              position: 'absolute',
              left: 0,
              right: 0,
              ...(onMeasureItem ? { minHeight: item.size } : { height: item.size }),
              [position === 'start' ? 'top' : 'bottom']: item.offset,
            }
          : {
              position: 'absolute',
              top: 0,
              bottom: 0,
              ...(onMeasureItem ? { minWidth: item.size } : { width: item.size }),
              [position === 'start' ? 'left' : 'right']: item.offset,
            };

        return (
          <StickyLayerItem
            key={`${position}-${item.index}`}
            index={item.index}
            isRow={isRow}
            style={itemStyle}
            measure={measureItem}
          >
            {render({ index: item.index })}
          </StickyLayerItem>
        );
      })}
    </div>
  );
}

type StickyLayerItemProps = {
  index: number;
  isRow: boolean;
  style: CSSProperties;
  children: ReactNode;
  measure: (index: number, size: number) => void;
};

function StickyLayerItem({ index, isRow, style, children, measure }: StickyLayerItemProps) {
  const itemRef = useRef<HTMLDivElement | null>(null);

  useResizeObserver(itemRef, (entry) => {
    measure(index, isRow ? entry.contentRect.height : entry.contentRect.width);
  });

  const setItemRef = useCallback(
    (element: HTMLDivElement | null) => {
      itemRef.current = element;
      if (element) {
        const rect = element.getBoundingClientRect();
        measure(index, isRow ? rect.height : rect.width);
      }
    },
    [index, isRow, measure],
  );

  return (
    <div
      ref={setItemRef}
      style={style}
    >
      <div style={{ pointerEvents: 'auto', ...(isRow ? { minHeight: '100%' } : { minWidth: '100%' }) }}>{children}</div>
    </div>
  );
}
