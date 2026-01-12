// based on https://github.com/streamich/react-use/blob/master/src/useSpring.ts
import { SpringSystem, Spring } from "rebound";
import { useState, useEffect } from "react";

export interface UseSpringOptions {
  target?: number;
  current?: number | null;
  tension?: number;
  friction?: number;
  round?: (x: number) => number;
}

export default function useSpring({
  target = 0,
  current = null,
  tension = 0,
  friction = 10,
  round = (x: number) => x,
}: UseSpringOptions): number {
  const [spring, setSpring] = useState<Spring | null>(null);
  const [value, setValue] = useState(target);

  useEffect(() => {
    const listener = {
      onSpringUpdate: (s: Spring) => {
        const val = s.getCurrentValue();
        setValue(round(val));
      },
    };

    if (!spring) {
      const newSpring = new SpringSystem().createSpring(tension, friction);
      newSpring.setCurrentValue(target);
      setSpring(newSpring);
      newSpring.addListener(listener);
      return;
    }

    return () => {
      spring.removeListener(listener);
      setSpring(null);
    };
  }, [tension, friction]);

  useEffect(() => {
    if (spring) {
      spring.setEndValue(target);
      if (current != null) {
        spring.setCurrentValue(current);
      }
    }
  }, [target, current]);

  return value;
}
