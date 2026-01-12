import React, { type ReactNode } from "react";
import useChildren from "./use-virtual-children";
import "./scroller.css";
import useSpring from "./use-spring";
import { nextIndex, prevIndex, getScrollTop } from "./utils";
import type { Change, Line } from "./types";

interface ScrollerState {
  snap: boolean;
  targetTop: number;
  currentTop: number | null;
  areaIndex: number;
}

type ChangeIndexFn = (areas: Change[], currentIndex: number) => number;

type ScrollerAction =
  | { type: "unsnap" }
  | { type: "change-area"; changeIndex: ChangeIndexFn; recalculate?: boolean }
  | { type: "manual-scroll"; newTop: number };

const initialState: ScrollerState = {
  snap: false,
  targetTop: 0,
  currentTop: 0,
  areaIndex: 0,
};

interface ScrollerProps<T, D> {
  items: T[];
  getRow: (item: T, index: number, data: D) => ReactNode;
  getRowHeight: (item: T, index: number, data: D) => number;
  data: D;
  snapAreas: Change[];
}

export default function Scroller<T, D>({
  items,
  getRow,
  getRowHeight,
  data,
  snapAreas,
}: ScrollerProps<T, D>): React.ReactElement {
  const ref = React.useRef<HTMLDivElement>(null);
  const height = useHeight(ref);

  const reducer = (
    prevState: ScrollerState,
    action: ScrollerAction
  ): ScrollerState => {
    switch (action.type) {
      case "unsnap":
        return !prevState.snap ? prevState : { ...prevState, snap: false };
      case "change-area": {
        if (snapAreas.length === 0) {
          return prevState;
        }

        const { changeIndex, recalculate } = action;
        const movingFromUnknownIndex = !prevState.snap || recalculate;

        // TODO memo
        const heights = items.map((item, i) => getRowHeight(item, i, data));

        let newIndex: number;
        if (movingFromUnknownIndex) {
          //todo memo
          const oldIndex = getAreaIndex(
            prevState.targetTop,
            snapAreas,
            heights,
            height ?? 0
          );

          newIndex = changeIndex(snapAreas, oldIndex);
        } else {
          newIndex = changeIndex(snapAreas, prevState.areaIndex);
        }

        if (newIndex === prevState.areaIndex && !movingFromUnknownIndex) {
          return prevState;
        }

        // TODO  memo
        const contentHeight = heights.reduce((a, b) => a + b, 0);

        const targetTop = getScrollTop(
          snapAreas[newIndex],
          contentHeight,
          height ?? 0,
          heights
        );

        return {
          ...prevState,
          areaIndex: newIndex,
          snap: true,
          currentTop: null,
          targetTop,
        };
      }
      case "manual-scroll": {
        const { newTop } = action;
        if (newTop === prevState.currentTop && !prevState.snap) {
          return prevState;
        }
        return {
          ...prevState,
          snap: false,
          currentTop: newTop,
          targetTop: newTop,
        };
      }
      default:
        throw Error();
    }
  };

  const [{ snap, targetTop, currentTop }, dispatch] = React.useReducer(
    reducer,
    initialState
  );

  const top = useSpring({
    target: targetTop,
    current: currentTop,
    round: Math.round,
  });

  const children = useChildren({
    height,
    top,
    items,
    getRow,
    getRowHeight,
    data,
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 38) {
        dispatch({ type: "change-area", changeIndex: prevIndex });
        e.preventDefault();
      } else if (e.keyCode === 40) {
        dispatch({ type: "change-area", changeIndex: nextIndex });
        e.preventDefault();
      }
    };
    document.body.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    dispatch({
      type: "unsnap",
    });
  }, [snapAreas]);

  React.useLayoutEffect(() => {
    if (snap && ref.current) {
      ref.current.scrollTop = top;
    }
  }, [snap, top]);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
      }}
      className="scroller"
      ref={ref}
      onScroll={(e) => {
        const newTop = (e.target as HTMLElement).scrollTop;
        if (newTop === top) {
          return;
        }
        dispatch({ type: "manual-scroll", newTop });
      }}
    >
      <code
        style={{
          display: "block",
          width: "calc(100% - 20px)",
          maxWidth: "900px",
          margin: "auto",
          padding: "10px",
          boxSizing: "border-box",
          height: "100%",
        }}
        children={children}
      />
    </div>
  );
}

function getAreaIndex(
  scrollTop: number,
  areas: Change[],
  heights: number[],
  containerHeight: number
): number {
  if (areas.length === 0) {
    return 0;
  }

  const scrollMiddle = scrollTop + containerHeight / 2;

  let h = 0;
  let i = 0;
  while (scrollMiddle > h) {
    h += heights[i++];
  }
  const middleRow = i;

  const areaCenters = areas.map((a) => (a.start + a.end) / 2);
  areaCenters.unshift(0);
  for (let a = 0; a < areas.length; a++) {
    if (middleRow < areaCenters[a + 1]) {
      return (
        a -
        (areaCenters[a + 1] - middleRow) / (areaCenters[a + 1] - areaCenters[a])
      );
    }
  }

  return areas.length - 0.9;
}

function useHeight(ref: React.RefObject<HTMLDivElement | null>): number | null {
  const [height, setHeight] = React.useState<number | null>(null);

  function handleResize() {
    if (ref.current) {
      setHeight(ref.current.clientHeight);
    }
  }

  React.useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return height;
}
