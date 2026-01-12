import easing, { type EasingFunction } from "./easing";
import type { Line, LineStyle } from "../types";

const MULTIPLY = "multiply";

export type AnimationTarget = Line;
export type AnimationResult = LineStyle | LineStyle[];
export type AnimationFunction = (
  t: number,
  targets?: AnimationTarget | AnimationTarget[]
) => AnimationResult;

interface TweenStyle {
  x?: number;
  opacity?: number;
  height?: number;
}

interface TweenProps {
  from: TweenStyle;
  to: TweenStyle;
  ease?: EasingFunction;
}

interface ChainProps {
  children: AnimationFunction[];
  durations: number[];
}

interface ParallelProps {
  children: AnimationFunction[];
}

export interface StaggerProps {
  interval: number;
  filter?: (target: AnimationTarget) => boolean;
  children: [AnimationFunction];
}

type AirframeElement = keyof typeof airframe;

declare global {
  interface Window {
    LOG?: string;
  }
}

function mergeResults(
  results: AnimationResult[],
  composite?: string
): AnimationResult {
  const firstResult = results[0];
  if (!firstResult || results.length < 2) {
    return firstResult || {};
  }
  if (Array.isArray(firstResult)) {
    return (firstResult as LineStyle[]).map((_, i) => {
      return mergeResults(
        results.map((result) => (result as LineStyle[])[i] || {}),
        composite
      ) as LineStyle;
    });
  } else {
    const merged = Object.assign({}, ...(results as LineStyle[])) as LineStyle;

    if (composite === MULTIPLY) {
      const opacities = (results as LineStyle[])
        .map((x) => x?.opacity)
        .filter((x) => x != null);
      if (opacities.length !== 0) {
        merged.opacity = opacities.reduce((a, b) => (a ?? 1) * (b ?? 1));
      }
    }
    return merged;
  }
}

const airframe = {
  parallel: ({ children: fns }: ParallelProps): AnimationFunction => {
    return (t, ...args) => {
      const styles = fns.map((fn) => fn(t, ...(args as [AnimationTarget[]])));
      const result = mergeResults(styles, MULTIPLY);
      return result;
    };
  },
  chain: ({ children: fns, durations }: ChainProps): AnimationFunction => {
    return (t, ...args) => {
      let style = fns[0]?.(0, ...(args as [AnimationTarget[]])) || {};
      let lowerDuration = 0;
      for (let i = 0; i < fns.length; i++) {
        const fn = fns[i];
        const thisDuration = durations[i] || 0;
        const upperDuration = lowerDuration + thisDuration;
        if (lowerDuration <= t && t <= upperDuration) {
          const innerT = thisDuration ? (t - lowerDuration) / thisDuration : 0;
          style = mergeResults([
            style,
            fn?.(innerT, ...(args as [AnimationTarget[]])) || {},
          ]);
        } else if (upperDuration < t) {
          style = mergeResults([
            style,
            fn?.(1, ...(args as [AnimationTarget[]])) || {},
          ]);
        } else if (t < lowerDuration) {
          style = mergeResults([
            fn?.(0, ...(args as [AnimationTarget[]])) || {},
            style,
          ]);
        }
        lowerDuration = upperDuration;
      }
      return style;
    };
  },
  delay: (): AnimationFunction => () => ({}),
  tween: ({
    from,
    to,
    ease = easing.linear,
  }: TweenProps): AnimationFunction => {
    return (t: number): LineStyle => {
      const style: LineStyle & { transform?: string } = {};
      (Object.keys(from) as (keyof TweenStyle)[]).forEach((key) => {
        const fromVal = from[key] ?? 0;
        const toVal = to[key] ?? 0;
        const value = fromVal + (toVal - fromVal) * ease(t);
        if (key === "x") {
          style.transform = `translateX(${value}px)`;
        } else {
          (style as Record<string, number>)[key] = value;
        }
      });
      return style;
    };
  },
};

/* @jsx createAnimation */
export const Stagger = (props: StaggerProps): AnimationFunction => {
  return (t: number, targets?: AnimationTarget | AnimationTarget[]) => {
    const targetArray = Array.isArray(targets)
      ? targets
      : targets
        ? [targets]
        : [];
    const filter = (target: AnimationTarget) =>
      !props.filter || props.filter(target);
    const filteredCount = targetArray.filter(filter).length;
    const interval =
      filteredCount < 2 ? 0 : props.interval / (filteredCount - 1);
    let i = 0;
    return targetArray.map((target) => {
      if (!filter(target)) {
        return {};
      }
      const animation = createAnimation(
        "parallel",
        {},
        createAnimation(
          "chain",
          { durations: [i * interval, 1 - props.interval] },
          createAnimation("delay", {}),
          props.children[0]
        )
      );
      i++;
      const result = animation(t, target);
      return result as LineStyle;
    });
  };
};

// Use 'any' for ComponentFunction to allow Stagger and similar components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentFunction = (props: any) => AnimationFunction;

export function createAnimation(
  type: AirframeElement | ComponentFunction,
  props: Record<string, unknown> | null,
  ...children: AnimationFunction[]
): AnimationFunction {
  const allProps = Object.assign({ children }, props);
  if (typeof type === "string") {
    if (window.LOG === "verbose") {
      return (t, ...args) => {
        console.groupCollapsed(type, t);
        const result = (
          airframe[type as keyof typeof airframe] as (
            props: Record<string, unknown>
          ) => AnimationFunction
        )(allProps)(t, ...(args as [AnimationTarget[]]));
        console.log(result);
        console.groupEnd();
        return result;
      };
    } else {
      return (
        airframe[type as keyof typeof airframe] as (
          props: Record<string, unknown>
        ) => AnimationFunction
      )(allProps);
    }
  } else {
    if (window.LOG === "verbose") {
      return (t, ...args) => {
        console.groupCollapsed((type as ComponentFunction).name, t);
        const result = (type as ComponentFunction)(allProps)(
          t,
          ...(args as [AnimationTarget[]])
        );
        console.log(result);
        console.groupEnd();
        return result;
      };
    } else {
      return (type as ComponentFunction)(allProps);
    }
  }
}
