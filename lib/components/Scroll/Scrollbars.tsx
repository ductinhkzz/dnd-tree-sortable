import { memo, forwardRef, useCallback, useMemo, MutableRefObject, CSSProperties, ReactNode } from 'react';
import { Scrollbars } from 'rc-scrollbars';
import type { ScrollValues } from 'rc-scrollbars';

import styles from './Scrollbars.module.css';

export type CustomScrollbarsProps = {
  overflowX?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
  onScroll?: (values: ScrollValues) => void;
  renderView?: typeof Scrollbars.defaultProps.renderView;
  renderTrackHorizontal?: typeof Scrollbars.defaultProps.renderTrackHorizontal;
  autoHide?: boolean;
};

const CustomScrollbars = forwardRef<HTMLElement, CustomScrollbarsProps>(function CustomScrollbars(
  { children, style, onScroll, overflowX, renderView, ...props },
  ref,
) {
  const scrollbarsStyle = useMemo<CSSProperties>(() => ({ ...style, flexGrow: 1, overflowY: 'hidden' }), [style]);

  const refSetter = useCallback(
    (scrollbarRef: Scrollbars) => {
      if (ref && scrollbarRef) {
        if (typeof ref === 'function') {
          ref(scrollbarRef.view ?? null);
          return;
        }

        (ref as MutableRefObject<HTMLElement | undefined>).current = scrollbarRef.view;
      }
    },
    [ref],
  );

  return (
    <Scrollbars
      {...props}
      autoHide
      autoHideTimeout={2000}
      autoHideDuration={500}
      style={scrollbarsStyle}
      onScrollFrame={onScroll}
      renderView={renderView}
      renderTrackHorizontal={
        overflowX ? undefined : (props) => <div {...props} className='track-horizontal' style={{ display: 'none' }} />
      }
      renderThumbVertical={({ style, ...props }) => <div {...props} style={{ ...style }} className={styles.Scroll} />}
      ref={refSetter}>
      {children}
    </Scrollbars>
  );
});

export default memo(CustomScrollbars);
