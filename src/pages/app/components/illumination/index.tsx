import { memo, useEffect } from 'react';
import Human from '@vladmandic/human';

import Mask from '../mask';

import useIllumination from './hooks/use-illumination';

interface Props {
  width: number;
  height: number;
  videoNode: HTMLVideoElement;
  faceDetector: Human;
}

const Illumination = ({ width, height, videoNode, faceDetector }: Props) => {
  const [illumination, illuminationActions] = useIllumination({
    width,
    height,
    videoNode,
    faceDetector,
  });

  useEffect(() => {
    illuminationActions.check();

    return illuminationActions.stopChecking;
  }, []);

  return (
    <Mask
      width={width}
      height={height}
      shadowImageMask={illumination.shadowImageMask}
      saturationImageMask={illumination.saturationImageMask}
    />
  );
};

export default memo(Illumination);
