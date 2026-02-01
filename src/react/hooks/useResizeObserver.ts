import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export function useResizeObserver(
  targetRef: RefObject<HTMLElement>,
  onResize: (entry: ResizeObserverEntry) => void,
): void {
  const callbackRef = useRef(onResize);

  useEffect(() => {
    callbackRef.current = onResize;
  }, [onResize]);

  useEffect(() => {
    const element = targetRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    let frame: number | null = null;
    const observer = new ResizeObserver((entries) => {
      if (frame !== null) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = null;
        for (const entry of entries) {
          callbackRef.current(entry);
        }
      });
    });

    observer.observe(element);

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      observer.disconnect();
    };
  }, [targetRef]);
}
