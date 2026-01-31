import type { ReactNode, UIEvent } from "react";
import { useMemo, useState } from "react";

export type VirtualScrollProps = {
  items: ReactNode[];
  itemHeight: number;
  height: number;
  width?: number | string;
  overscan?: number;
  className?: string;
};

export function VirtualScroll({
  items,
  itemHeight,
  height,
  width = "100%",
  overscan = 2,
  className
}: VirtualScrollProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const baseStart = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(height / itemHeight);
    const start = Math.max(0, baseStart - overscan);
    const end = Math.min(items.length, baseStart + visibleCount + overscan);

    return { startIndex: start, endIndex: end };
  }, [height, itemHeight, items.length, overscan, scrollTop]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  return (
    <div
      className={className}
      style={{
        height,
        width,
        overflow: "auto",
        position: "relative"
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {items.slice(startIndex, endIndex).map((item, offset) => {
          const index = startIndex + offset;
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top: index * itemHeight,
                height: itemHeight,
                left: 0,
                right: 0
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}
