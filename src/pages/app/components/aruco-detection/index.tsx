import { memo, useRef, useEffect } from 'react';

import Mask from '../mask';

import useArucoDetection from './hooks/use-aruco-detection';

import styles from './styles.module.scss';

import { CORRECT_IDS } from './constants';

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
        <p>
          Uniq ids:{' '}
          {arucoDetectionState.uniqIds.map((id) => (
            <span key={id} className={CORRECT_IDS.includes(id) ? styles.correct : styles.incorrect}>
              {id}
            </span>
          ))}
        </p>
        <p>
          Ids:{' '}
          {arucoDetectionState.ids.map((id) => (
            <span key={id} className={CORRECT_IDS.includes(id) ? styles.correct : styles.incorrect}>
              {id}
            </span>
          ))}
        </p>
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
        <p>Count of success frames(4 ids are detected): {arucoDetectionState.countOfSuccess}</p>
      </div>
    </>
  );
};

export default memo(Illumination);
