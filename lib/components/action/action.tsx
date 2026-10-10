import { CSSProperties, HTMLAttributes, Ref } from 'react';
import classNames from 'clsx';

import styles from './action.module.css';

export interface ActionProps extends HTMLAttributes<HTMLButtonElement> {
  active?: {
    fill: string;
    background: string;
  };
  cursor?: CSSProperties['cursor'];
  elementRef?: Ref<HTMLButtonElement>;
}

export const Action = ({ active, className, cursor, style, elementRef, ...props }: ActionProps) => {
  return (
    <button
      ref={elementRef}
      type='button'
      {...props}
      className={classNames(styles.Action, className)}
      tabIndex={0}
      style={
        {
          ...style,
          cursor,
          '--fill': active?.fill,
          '--background': active?.background,
        } as CSSProperties
      }
    />
  );
};
