import { TreeItem } from '../../types';
import styles from './tree-item.module.css';

const DefaultContent = <T extends TreeItem>({ id }: T) => {
  return <span className={styles.Text}>{id}</span>;
};

export { DefaultContent };
