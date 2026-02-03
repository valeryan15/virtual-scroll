import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export type ScrollPosition = {
  top: number;
  left: number;
};

export function useScrollPosition(viewportRef: RefObject<HTMLElement | null>): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>({ top: 0, left: 0 });
  const latestPositionRef = useRef<ScrollPosition>(position);
  const frameRef = useRef<number | null>(null);
  const setPositionIfChanged = useCallback((next: ScrollPosition) => {
    const current = latestPositionRef.current;
    if (current.top === next.top && current.left === next.left) {
      return;
    }
    latestPositionRef.current = next;
    setPosition(next);
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      frameRef.current = null;
      setPositionIfChanged({
        top: element.scrollTop,
        left: element.scrollLeft,
      });
    };

    const onScroll = () => {
      if (frameRef.current !== null) {
        return;
      }
      frameRef.current = requestAnimationFrame(update);
    };

    update();
    element.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      element.removeEventListener('scroll', onScroll);
    };
  }, [setPositionIfChanged, viewportRef]);

  return position;
}
