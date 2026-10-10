import { KeyboardSensor, type Draggable, type KeyboardSensorOptions } from '@dnd-kit/dom';
import type { FlattenedItem, SensorContext } from './types';
import { getProjection } from './utilities';

/** Keyboard navigation follows visible tree order; horizontal arrows change nesting only. */
export function createTreeKeyboardSensor<T extends FlattenedItem>(
  context: SensorContext<T>,
  indentationWidth: number,
): typeof KeyboardSensor {
  return class TreeKeyboardSensor extends KeyboardSensor {
    protected handleStart(event: KeyboardEvent, source: Draggable, options: KeyboardSensorOptions | undefined) {
      super.handleStart(event, source, options);
      void this.manager.actions.setDropTarget(source.id);
    }

    protected handleMove(direction: 'up' | 'down' | 'left' | 'right', event: KeyboardEvent) {
      const { source, target, position } = this.manager.dragOperation;
      if (!source) return;
      event.preventDefault();
      const { items } = context.current;
      const overId = target?.id ?? source.id;
      if (direction === 'left' || direction === 'right') {
        const { depth, minDepth, maxDepth } = getProjection(
          items,
          source.id,
          overId,
          position.current.x - position.initial.x,
          indentationWidth,
        );
        if ((direction === 'left' && depth > minDepth) || (direction === 'right' && depth < maxDepth)) {
          this.manager.actions.move({
            event,
            by: { x: direction === 'left' ? -indentationWidth : indentationWidth, y: 0 },
          });
        }
        return;
      }
      const index = items.findIndex(({ id }) => id === overId);
      const next = items[index + (direction === 'up' ? -1 : 1)];
      if (!next) return;
      const droppable = this.manager.registry.droppables.get(next.id);
      const element = droppable?.element;
      const currentElement = target?.element ?? source.element;
      if (!element || !currentElement) return;
      const nextRect = element.getBoundingClientRect();
      const currentRect = currentElement.getBoundingClientRect();
      void this.manager.actions.setDropTarget(next.id).then(() => {
        this.manager.actions.move({ event, by: { x: 0, y: nextRect.top - currentRect.top } });
        element.scrollIntoView?.({ block: 'nearest' });
      });
    }
  };
}
