import type { Change } from "./types";

export function nextIndex<T>(list: T[], currentIndex: number): number {
  return Math.min(list.length - 1, Math.floor(currentIndex + 1));
}

export function prevIndex<T>(list: T[], currentIndex: number): number {
  return Math.max(0, Math.ceil(currentIndex - 1));
}

export function closestIndex<T>(list: T[], currentIndex: number): number {
  return Math.min(Math.max(0, Math.round(currentIndex)), list.length - 1);
}

export function getScrollTop(
  area: Change,
  contentHeight: number,
  containerHeight: number,
  heights: number[]
): number {
  const start = heights.slice(0, area.start).reduce((a, b) => a + b, 0);
  const end =
    start + heights.slice(area.start, area.end + 1).reduce((a, b) => a + b, 0);
  const middle = (end + start) / 2;
  const halfContainer = containerHeight / 2;
  const bestTop =
    end - start > containerHeight ? start : middle - halfContainer;
  if (bestTop < 0) return 0;
  if (bestTop + containerHeight > contentHeight) {
    return contentHeight - containerHeight;
  }
  return bestTop;
}
