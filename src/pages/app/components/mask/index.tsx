import { memo } from 'react';
import classnames from 'classnames';

import styles from './styles.module.scss';

interface Props {
  width: number;
  height: number;
  className?: string;
  illuminationCanvasRef: React.RefObject<HTMLCanvasElement>;
}

const Mask = ({ width, height, className, illuminationCanvasRef }: Props) => {
  return (
    <div className={classnames(styles.imageWrapper, className)}>
      <canvas width={width} height={height} ref={illuminationCanvasRef} className={styles.canvas} />
    </div>
  );
};

export default memo(Mask);
