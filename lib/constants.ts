import { defaultDropAnimation, DropAnimation, KeyboardCode, MeasuringStrategy } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

export const directions: string[] = [KeyboardCode.Down, KeyboardCode.Right, KeyboardCode.Up, KeyboardCode.Left];

export const horizontal: string[] = [KeyboardCode.Left, KeyboardCode.Right];

export const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
    ];
  },
  easing: 'ease-out',
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    });
  },
};
