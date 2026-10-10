import type { ButtonHTMLAttributes, CSSProperties, Ref } from 'react';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';

export interface ActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: { fill: string; background: string };
  cursor?: CSSProperties['cursor'];
  elementRef?: Ref<HTMLButtonElement>;
}

export const Action = ({ active, className, cursor, style, elementRef, ...props }: ActionProps) => (
  <button
    {...props}
    ref={elementRef}
    type='button'
    className={cn(
      buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
      'box-border border-0 bg-transparent p-0 font-[inherit] text-muted-foreground hover:text-foreground motion-reduce:transition-none',
      className,
    )}
    style={{ ...style, cursor, ...(active ? { color: active.fill, backgroundColor: active.background } : {}) }}
  />
);
