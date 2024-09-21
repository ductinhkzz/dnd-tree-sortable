import {
  closestCorners,
  getFirstCollision,
  KeyboardCode,
  KeyboardCoordinateGetter,
  DroppableContainer,
  SensorContext as DndSensorContext,
} from '@dnd-kit/core';
import { Coordinates } from '@dnd-kit/utilities';

import type { FlattenedItem, NonNullablePick, SensorContext } from './types';
import { getProjection } from './utilities';
import { directions, horizontal } from './constants';

const handleHorizontalMovement = (
  items: FlattenedItem[],
  event: KeyboardEvent,
  currentCoordinates: Coordinates,
  activeId: FlattenedItem['id'],
  overId: FlattenedItem['id'],
  offset: number,
  indentationWidth: number,
) => {
  const { depth, maxDepth, minDepth } = getProjection(items, activeId, overId, offset, indentationWidth);

  switch (event.code) {
    case KeyboardCode.Left:
      if (depth > minDepth) {
        return {
          ...currentCoordinates,
          x: currentCoordinates.x - indentationWidth,
        };
      }
      break;
    case KeyboardCode.Right:
      if (depth < maxDepth) {
        return {
          ...currentCoordinates,
          x: currentCoordinates.x + indentationWidth,
        };
      }
      break;
  }

  return undefined;
};

const getEligibleContainers = (
  event: KeyboardEvent,
  overId: FlattenedItem['id'] | undefined,
  collisionRect: NonNullable<DndSensorContext['collisionRect']>,
  droppableContainers: DndSensorContext['droppableContainers'],
  droppableRects: DndSensorContext['droppableRects'],
): DroppableContainer[] => {
  const containers: DroppableContainer[] = [];

  droppableContainers.forEach((container) => {
    if (container?.disabled || container.id === overId) {
      return;
    }

    const rect = droppableRects.get(container.id);

    if (!rect) {
      return;
    }

    switch (event.code) {
      case KeyboardCode.Down:
        if (collisionRect.top < rect.top) {
          containers.push(container);
        }
        break;
      case KeyboardCode.Up:
        if (collisionRect.top > rect.top) {
          containers.push(container);
        }
        break;
    }
  });

  return containers;
};
type Params = [
  FlattenedItem[],
  NonNullablePick<DndSensorContext, 'active' | 'collisionRect' | 'droppableRects' | 'droppableContainers'>,
  number,
  boolean,
];
const getNewCoordinates = (
  closestId: FlattenedItem['id'],
  ...[items, context, indentationWidth, indicator]: Params
) => {
  const { droppableRects, collisionRect, droppableContainers, active } = context;
  const activeRect = droppableRects.get(active.id);
  const newRect = droppableRects.get(closestId);
  const newDroppable = droppableContainers.get(closestId);

  if (activeRect && newRect && newDroppable) {
    const newIndex = items.findIndex(({ id }) => id === closestId);
    const newItem = items[newIndex];
    const activeIndex = items.findIndex(({ id }) => id === active.id);
    const activeItem = items[activeIndex];

    if (newItem && activeItem) {
      const { depth } = getProjection(
        items,
        active.id,
        closestId,
        (newItem.depth - activeItem.depth) * indentationWidth,
        indentationWidth,
      );
      const isBelow = newIndex > activeIndex;
      const modifier = isBelow ? 1 : -1;
      const offset = indicator ? (collisionRect.height - activeRect.height) / 2 : 0;

      const newCoordinates = {
        x: newRect.left + depth * indentationWidth,
        y: newRect.top + modifier * offset,
      };

      return newCoordinates;
    }
  }
};

const handleVerticalMovement = (
  containers: DroppableContainer[],
  overId: FlattenedItem['id'] | undefined,
  ...args: Params
) => {
  const [, context] = args;
  const { droppableRects, collisionRect, active } = context;
  const collisions = closestCorners({
    active,
    collisionRect,
    pointerCoordinates: null,
    droppableRects,
    droppableContainers: containers,
  });
  let closestId = getFirstCollision(collisions, 'id');

  if (closestId === overId && collisions.length > 1) {
    closestId = collisions[1].id;
  }

  if (closestId && overId) {
    return getNewCoordinates(closestId, ...args);
  }
};

export const sortableTreeKeyboardCoordinates: <T extends FlattenedItem>(
  context: SensorContext<T>,
  indicator: boolean,
  indentationWidth: number,
) => KeyboardCoordinateGetter =
  (context, indicator, indentationWidth) =>
  (event, { currentCoordinates, context: { active, over, collisionRect, droppableRects, droppableContainers } }) => {
    if (directions.includes(event.code)) {
      if (!active || !collisionRect) {
        return;
      }

      event.preventDefault();

      const {
        current: { items, offset },
      } = context;

      if (horizontal.includes(event.code) && over?.id) {
        return handleHorizontalMovement(items, event, currentCoordinates, active.id, over.id, offset, indentationWidth);
      }

      const containers = getEligibleContainers(event, over?.id, collisionRect, droppableContainers, droppableRects);

      return handleVerticalMovement(
        containers,
        over?.id,
        items,
        {
          collisionRect,
          droppableRects,
          droppableContainers,
          active,
        },
        indentationWidth,
        indicator,
      );
    }

    return undefined;
  };
