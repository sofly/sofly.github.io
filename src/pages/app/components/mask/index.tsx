import { memo } from 'react';
import classnames from 'classnames';

import { useIds } from '../../../../hooks/use-id';

import styles from './styles.module.scss';

interface Props {
  width: number;
  height: number;
  className?: string;
  classNameSvg?: string;
  shadowImageMask: string;
  saturationImageMask: string;
}

const Mask = ({
  width,
  height,
  className,
  classNameSvg,
  shadowImageMask,
  saturationImageMask,
}: Props) => {
  const [shadowId, saturationId] = useIds(2);

  const shouldRenderMask = !!shadowImageMask && !!saturationImageMask;

  return (
    <div className={classnames(styles.imageWrapper, className)}>
      {shouldRenderMask && (
        <svg viewBox={`0 0 ${width} ${height}`} className={classnames(styles.mask, classNameSvg)}>
          <mask id={shadowId.toString()} x="0" y="0" width="100" height="100">
            <image href={shadowImageMask} width="100%" height="100%" />
          </mask>
          <mask id={saturationId.toString()} x="0" y="0" width="100" height="100">
            <image href={saturationImageMask} width="100%" height="100%" />
          </mask>

          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            stroke="none"
            fill="var(--revea--illumination-shadow--color)"
            mask={`url(#${shadowId})`}
          />
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            stroke="none"
            fill="var(--revea--illumination-saturation--color)"
            mask={`url(#${saturationId})`}
          />
        </svg>
      )}
    </div>
  );
};

export default memo(Mask);
