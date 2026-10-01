import { useRef } from 'react';
import { useElementSize, useMergedRef } from '@mantine/hooks';

export function getResponsiveLanes(width: number): number {
  if (width >= 1200) return 4;
  if (width >= 960) return 3;
  if (width >= 720) return 2;
  return 1;
}

export function useResponsiveLanes() {
  const elementRef = useRef<HTMLDivElement>(null);
  const { ref: sizeRef, width } = useElementSize<HTMLDivElement>();
  const ref = useMergedRef(elementRef, sizeRef);
  return { ref, elementRef, lanes: getResponsiveLanes(width) };
}