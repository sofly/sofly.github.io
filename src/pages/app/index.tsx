import { useEffect, useRef } from 'react';
import classnames from 'classnames';

import { useStream } from '../../hooks/use-stream';
import { useVideoState } from '../../hooks/use-video-state';

import { IDEAL_RESOLUTION } from './constants';

import ArucoDetection from './components/aruco-detection';

import styles from './styles.module.scss';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoState, videoStateActions] = useVideoState();
  const [streamState, streamActions, streamHelpers] = useStream({
    videoRef,
    streamWidth: IDEAL_RESOLUTION.WIDTH,
    streamHeight: IDEAL_RESOLUTION.HEIGHT,
    streamAspectRatio: IDEAL_RESOLUTION.ASPECT_RATIO,
  });

  useEffect(() => {
    streamActions.createStream();
  }, []);

  const isAppReady = videoState.isPlaying && videoState.isLoadedMetaData && streamHelpers.isStateReady();

  const videoTrack = streamState.stream?.getVideoTracks()[0];
  const constraints = videoTrack?.getSettings();

  return (
    <div className={classnames(styles.wrapper, { [styles.ready]: isAppReady })}>
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          muted
          onPlay={videoStateActions.videoPlaying}
          autoPlay
          controls={false}
          className={styles.video}
          playsInline
          onLoadedMetadata={videoStateActions.videoLoadedMetadata}
        />

        {isAppReady && (
          <ArucoDetection width={constraints?.width!} height={constraints?.height!} videoNode={videoRef.current!} />
        )}
      </div>

      <div className={styles.loader}>Loading...</div>
    </div>
  );
}

export default App;
