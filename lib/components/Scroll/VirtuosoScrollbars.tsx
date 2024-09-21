import { ComponentProps, Ref, forwardRef } from 'react';

import CustomScrollbars from './Scrollbars';

type VirtuosoScrollbarsProps = ComponentProps<typeof CustomScrollbars>;

const VirtuosoScrollbars = forwardRef(function VirtuosoScrollbars(
  { style, children, ...props }: VirtuosoScrollbarsProps,
  ref: Ref<HTMLDivElement>,
) {
  return (
    <CustomScrollbars
      style={style}
      ref={ref}
      renderView={(viewProps) => <div {...viewProps} {...props} tabIndex={-1} />}>
      {children}
    </CustomScrollbars>
  );
});

export { VirtuosoScrollbars };
