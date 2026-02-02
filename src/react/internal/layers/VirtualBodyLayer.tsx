import type { CSSProperties, ReactNode } from 'react';

type VirtualBodyLayerProps = {
  style: CSSProperties;
  children: ReactNode;
};

export function VirtualBodyLayer({ style, children }: VirtualBodyLayerProps) {
  return (
    <div data-virtual-layer="body" style={style}>
      {children}
    </div>
  );
}
