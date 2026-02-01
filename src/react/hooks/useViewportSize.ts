import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useResizeObserver } from './useResizeObserver';

export type ViewportSize = {
  width: number;
  height: number;
};

export function useViewportSize(viewportRef: RefObject<HTMLElement>): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    setSize({
      width: element.clientWidth,
      height: element.clientHeight,
    });
  }, [viewportRef]);

  useResizeObserver(viewportRef, (entry) => {
    if (frameRef.current !== null) {
      return;
    }
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const target = entry.target as HTMLElement;
      setSize({
        width: target.clientWidth,
        height: target.clientHeight,
      });
    });
  });

  return size;
}
