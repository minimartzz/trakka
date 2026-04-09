import { useCallback, useRef, useState } from "react";

/**
 * Returns a [ref callback, { width, height }] pair.
 * Attach `ref` to any DOM element; width/height update whenever it resizes.
 * Use this to pass explicit dimensions to Recharts chart components instead
 * of wrapping them in <ResponsiveContainer>.
 */
export function useContainerSize(): [
  (node: HTMLDivElement | null) => void,
  { width: number; height: number },
] {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      // Capture initial size immediately
      const { width, height } = node.getBoundingClientRect();
      setSize({ width: Math.floor(width), height: Math.floor(height) });

      observerRef.current = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setSize({ width: Math.floor(width), height: Math.floor(height) });
      });
      observerRef.current.observe(node);
    }
  }, []);

  return [ref, size];
}