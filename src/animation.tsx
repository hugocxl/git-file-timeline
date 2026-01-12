import { createAnimation, Stagger } from "./airframe/airframe";
import easing from "./airframe/easing";
import type { Line, LineStyle } from "./types";

const dx = 250;
const offOpacity = 0.6;

/* @jsx createAnimation */

// window.LOG = "verbose";

type AnimationFunction = (
  t: number,
  targets?: Line | Line[]
) => LineStyle | LineStyle[];

const SlideToLeft = (): AnimationFunction =>
  createAnimation("tween", {
    from: { x: 0, opacity: 1 },
    to: { x: -dx, opacity: 0 },
    ease: easing.easeInQuad,
  });

function ShrinkHeight(): AnimationFunction {
  return createAnimation("tween", {
    from: { height: 15 },
    to: { height: 0 },
    ease: easing.easeInOutQuad,
  });
}

const SlideFromRight = (): AnimationFunction =>
  createAnimation("tween", {
    from: { x: dx, opacity: 0 },
    to: { x: 0, opacity: 1 },
    ease: easing.easeOutQuad,
  });

function GrowHeight(): AnimationFunction {
  return createAnimation("tween", {
    from: { height: 0 },
    to: { height: 15 },
    ease: easing.easeInOutQuad,
  });
}

interface SwitchLinesProps {
  filterExit: (line: Line) => boolean;
  filterEnter: (line: Line) => boolean;
  filterFadeOut: (line: Line) => boolean;
}

function SwitchLines({
  filterExit,
  filterEnter,
  filterFadeOut,
}: SwitchLinesProps): AnimationFunction {
  return createAnimation(
    "parallel",
    {},
    createAnimation(
      Stagger,
      { interval: 0.2, filter: filterExit },
      createAnimation(
        "chain",
        { durations: [0.35, 0.3, 0.35] },
        SlideToLeft(),
        ShrinkHeight()
      )
    ),
    createAnimation(
      Stagger,
      { interval: 0.2, filter: filterEnter },
      createAnimation(
        "chain",
        { durations: [0.35, 0.3, 0.35] },
        createAnimation("delay", {}),
        GrowHeight(),
        SlideFromRight()
      )
    ),
    createAnimation(
      Stagger,
      { interval: 0, filter: filterEnter },
      createAnimation("tween", {
        from: { opacity: offOpacity },
        to: { opacity: 1 },
      })
    ),
    createAnimation(
      Stagger,
      { interval: 0, filter: filterFadeOut },
      createAnimation("tween", {
        from: { opacity: 1 },
        to: { opacity: offOpacity },
        ease: easing.easeOutCubic,
      })
    ),
    createAnimation(
      Stagger,
      {
        interval: 0,
        filter: (l: Line) => !filterEnter(l) && !filterFadeOut(l),
      },
      createAnimation("tween", {
        from: { opacity: offOpacity },
        to: { opacity: offOpacity },
      })
    )
  );
}

const animation: AnimationFunction = createAnimation(
  "chain",
  { durations: [0.5, 0.5] },
  SwitchLines({
    filterExit: (line) => line.left && !line.middle,
    filterEnter: (line) => !line.left && line.middle,
    filterFadeOut: () => false,
  }),
  SwitchLines({
    filterExit: (line) => line.middle && !line.right,
    filterEnter: (line) => !line.middle && line.right,
    filterFadeOut: (line) => !line.left && line.middle,
  })
);

export default animation;
