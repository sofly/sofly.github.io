import { memo, useRef, useEffect } from 'react';

import Mask from '../mask';

import useArucoDetection from './hooks/use-aruco-detection';

import styles from './styles.module.scss';

interface Props {
  width: number;
  height: number;
  videoNode: HTMLVideoElement;
}

const Illumination = ({ width, height, videoNode }: Props) => {
  const illuminationCanvasRef = useRef<HTMLCanvasElement>(null);

  const [arucoDetectionState, arucoDetectionActions] = useArucoDetection({
    width,
    height,
    videoNode,
    illuminationCanvasRef,
  });

  useEffect(() => {
    arucoDetectionActions.detect();

    return arucoDetectionActions.stopDetecting;
  }, []);

  return (
    <>
      <Mask width={width} height={height} illuminationCanvasRef={illuminationCanvasRef} />

      <div className={styles.info}>
        <p>Ids: {arucoDetectionState.ids.join(', ')}</p>
        <p>
          Rotation: <br />
          Roll: {Math.round(arucoDetectionState.rotation.roll)}
          <br />
          Pitch: {Math.round(arucoDetectionState.rotation.pitch)}
          <br />
          Yaw: {Math.round(arucoDetectionState.rotation.yaw)}
          <br />
        </p>
        <p>Time: {arucoDetectionState.time}ms</p>
      </div>
    </>
  );
};

export default memo(Illumination);
