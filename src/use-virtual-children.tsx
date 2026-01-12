import React, { type ReactNode } from "react";

export interface UseChildrenOptions<T, D> {
  items: T[];
  getRow: (item: T, index: number, data: D) => ReactNode;
  getRowHeight: (item: T, index: number, data: D) => number;
  height: number | null;
  top: number;
  data: D;
}

export default function useChildren<T, D>({
  items,
  getRow,
  getRowHeight,
  height,
  top,
  data,
}: UseChildrenOptions<T, D>): ReactNode[] {
  const children: ReactNode[] = [];

  const extraRender = 1000;

  const topT = top - extraRender;
  const bottomT = top + (height ?? 0) + extraRender;
  let h = 0;

  let topPlaceHolderH = 0;
  let bottomPlaceholderH = 0;

  // This is the bottleneck
  items.forEach((item, i) => {
    const itemH = getRowHeight(item, i, data);
    const nextH = h + itemH;
    const isOverTop = nextH < topT;
    const isUnderBottom = h > bottomT;

    if (isOverTop) {
      topPlaceHolderH += itemH;
    } else if (isUnderBottom) {
      bottomPlaceholderH += itemH;
    } else {
      children.push(getRow(item, i, data));
    }

    h = nextH;
  });

  children.unshift(<div style={{ height: topPlaceHolderH }} key="top-ph" />);
  children.push(<div style={{ height: bottomPlaceholderH }} key="bottom-ph" />);
  return children;
}
