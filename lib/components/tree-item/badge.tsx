import { Badge as UiBadge } from '@/components/ui/badge';

export type BadgeProps = { count: number };
export const Badge = ({ count }: BadgeProps) => (
  <UiBadge className='absolute -top-2 -right-2' aria-label={`${count} items`}>
    {count}
  </UiBadge>
);
