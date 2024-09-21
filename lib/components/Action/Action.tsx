import { CSSProperties, HTMLAttributes } from 'react';
import classNames from 'clsx';

import styles from './Action.module.scss';

export interface ActionProps extends HTMLAttributes<HTMLButtonElement> {
  active?: {
    fill: string;
    background: string;
  };
  cursor?: CSSProperties['cursor'];
}

export const Action = ({ active, className, cursor, style, ...props }: ActionProps) => {
  return (
    <button
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
