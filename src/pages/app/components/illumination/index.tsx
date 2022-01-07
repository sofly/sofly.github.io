import { memo, useRef, useEffect } from 'react';

import { FaceDetector } from '../../../../types';

import Mask from '../mask';

import useIllumination from './hooks/use-illumination';

import styles from './styles.module.scss';

interface Props {
  width: number;
  height: number;
  videoNode: HTMLVideoElement;
  faceDetector: FaceDetector;
}

const Illumination = ({ width, height, videoNode, faceDetector }: Props) => {
  const illuminationCanvasRef = useRef<HTMLCanvasElement>(null);

  const [illumination, illuminationActions] = useIllumination({
    width,
    height,
    videoNode,
    faceDetector,
    illuminationCanvasRef,
  });

  useEffect(() => {
    illuminationActions.check();

    return illuminationActions.stopChecking;
  }, []);

  return (
    <>
      <Mask width={width} height={height} illuminationCanvasRef={illuminationCanvasRef} />

      <div className={styles.info}>
        <p>Face detection duration: {illumination.faceDetectionMs}ms</p>
        <p>Algorithm duration: {illumination.algorithmMs}ms</p>
        <p>Shadow value: {illumination.shadowValue.toFixed(2)}</p>
        <p>Saturation value: {illumination.saturationValue.toFixed(2)}</p>
        <p>Background saturation value: {illumination.backgroundSaturationValue.toFixed(2)}</p>
      </div>
    </>
  );
};

export default memo(Illumination);
