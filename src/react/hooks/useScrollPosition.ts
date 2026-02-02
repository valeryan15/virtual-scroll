import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export type ScrollPosition = {
  top: number;
  left: number;
};

export function useScrollPosition(viewportRef: RefObject<HTMLElement | null>): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>({ top: 0, left: 0 });
  const frameRef = useRef<number | null>(null);
  const useIsomorphicLayoutEffect =
    typeof window === 'undefined' || typeof window.requestAnimationFrame === 'undefined'
      ? useEffect
      : useLayoutEffect;

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      frameRef.current = null;
      setPosition({
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

    onScroll();
    element.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      element.removeEventListener('scroll', onScroll);
    };
  }, [viewportRef]);

  useIsomorphicLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    if (element.scrollTop !== position.top || element.scrollLeft !== position.left) {
      setPosition({
        top: element.scrollTop,
        left: element.scrollLeft,
      });
    }
  });

  return position;
}
