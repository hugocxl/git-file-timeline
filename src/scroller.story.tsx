import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Scroller from "./scroller";
import type { Change } from "./types";

interface Item {
  content: string;
  key: number;
  height: number;
}

const snapAreas1: Change[] = [
  { start: 1, end: 5 },
  { start: 15, end: 26 },
  { start: 50, end: 100 },
  { start: 300, end: 302 },
];

const snapAreas2: Change[] = [
  { start: 8, end: 12 },
  { start: 30, end: 32 },
  { start: 550, end: 552 },
  { start: 595, end: 599 },
];

const items: Item[] = Array(600)
  .fill(0)
  .map((_, i) => {
    const a1 = snapAreas1.find((a) => a.start <= i && i <= a.end);
    const a2 = snapAreas2.find((a) => a.start <= i && i <= a.end);
    return {
      content: `Row ${i}${
        a1
          ? ` - Area1 [${a1.start}, ${a1.end}]`
          : a2
            ? ` - Area2 [${a2.start}, ${a2.end}]`
            : ""
      }`,
      key: i,
      height: 22,
    };
  });

function getRow(item: Item): React.ReactElement {
  return (
    <div key={item.key} style={{ height: item.height }}>
      {item.content}
    </div>
  );
}

function getRowHeight(item: Item): number {
  return item.height;
}

interface BasicScrollerProps {
  areas: Change[];
}

function BasicScroller({ areas }: BasicScrollerProps): React.ReactElement {
  return (
    <Scroller
      items={items}
      snapAreas={areas}
      getRow={getRow}
      getRowHeight={getRowHeight}
      data={null}
    />
  );
}

function DoubleScroller(): React.ReactElement {
  const [flag, setFlag] = React.useState(false);
  return (
    <div>
      <div style={{ height: "80vh", border: "1px solid black", width: "60vw" }}>
        <BasicScroller areas={flag ? snapAreas1 : snapAreas2} />
      </div>
      <div>
        {flag ? "Areas 1" : "Areas 2"}
        <button onClick={() => setFlag((f) => !f)}>Toggle</button>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Scroller",
};

export default meta;

export const Single: StoryObj = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "90vh",
      }}
    >
      <div style={{ width: "60%", height: "80vh", border: "1px solid black" }}>
        <BasicScroller areas={snapAreas1} />
      </div>
    </div>
  ),
};

export const Multiple: StoryObj = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "90vh",
      }}
    >
      <DoubleScroller />
    </div>
  ),
};
