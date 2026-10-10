import { KeyboardSensor, type Draggable, type KeyboardSensorOptions } from '@dnd-kit/dom';
import type { FlattenedItem, SensorContext } from './types';
import { getProjection } from './utilities';

/** Keyboard navigation follows visible tree order; horizontal arrows change nesting only. */
export function createTreeKeyboardSensor<T extends object>(
  context: SensorContext<FlattenedItem<T>>,
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
        const projection = getProjection(
          items,
          source.id,
          overId,
          position.current.x - position.initial.x,
          indentationWidth,
          context.current.canHaveChildren,
        );
        if (!projection) return;
        const { depth, minDepth, maxDepth } = projection;
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
      const nextIndex = index + (direction === 'up' ? -1 : 1);
      const activatorEvent = this.manager.dragOperation.activatorEvent;
      const currentTop = (target?.element ?? source.element)?.getBoundingClientRect().top;
      void (async () => {
        await context.current.reveal?.(nextIndex);
        // A scroll/mount can finish after Escape or a controlled data update.
        if (
          this.manager.dragOperation.source?.id !== source.id ||
          this.manager.dragOperation.activatorEvent !== activatorEvent
        )
          return;
        const element = this.manager.registry.droppables.get(next.id)?.element;
        if (!element) return;
        await this.manager.actions.setDropTarget(next.id);
        this.manager.actions.move({ event, by: { x: 0, y: element.getBoundingClientRect().top - (currentTop ?? 0) } });
        element.scrollIntoView?.({ block: 'nearest' });
      })();
    }
  };
}
