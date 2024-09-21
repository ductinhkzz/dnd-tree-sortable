import styles from './TreeItem.module.css';

export type BadgeProps = {
  count: number;
};

const Badge = (props: BadgeProps) => {
  return <span className={styles.Count}>{props.count}</span>;
};

export { Badge };
