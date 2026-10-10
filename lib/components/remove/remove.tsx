import { X } from 'lucide-react';
import { cn } from 'cn';
import { Action, type ActionProps } from '../action';

export const Remove = ({ className, ...props }: ActionProps) => (
  <Action
    aria-label='Remove item'
    {...props}
    className={cn('hover:bg-destructive/10 hover:text-destructive', className)}
  >
    <X aria-hidden='true' className='size-4' />
  </Action>
);
