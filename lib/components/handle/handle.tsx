import { GripVertical } from 'lucide-react';
import { Action, type ActionProps } from '../action';

export const Handle = (props: ActionProps) => (
  <Action
    aria-label='Drag item'
    title='Drag item. Space to pick up, arrows to move, Escape to cancel.'
    cursor='grab'
    className='touch-none'
    {...props}
  >
    <GripVertical aria-hidden='true' className='size-4' />
  </Action>
);
