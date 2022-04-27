import { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';

import { useStream } from '../../hooks/use-stream';
import { useVideoState } from '../../hooks/use-video-state';

import { useUploadVideo } from './hooks/use-upload-video';
import { useVideoRecorder } from './hooks/use-video-recorder';

import { IDEAL_RESOLUTION } from './constants';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const [state, setState] = useState({
    size: '0',
    counter: 0,
    blobType: '-',
    startedAt: null as Nullable<number>,
  });

  const [videoState, videoStateActions] = useVideoState();
  const [uploadVideoState, uploadVideoActions, uploadVideoHelpers] = useUploadVideo();
  const [videoRecorderState, videoRecorderActions, videoRecorderHelpers] = useVideoRecorder();
  const [streamState, streamActions, streamHelpers] = useStream({
    videoRef,
    streamWidth: IDEAL_RESOLUTION.WIDTH,
    streamHeight: IDEAL_RESOLUTION.HEIGHT,
    streamAspectRatio: IDEAL_RESOLUTION.ASPECT_RATIO,
  });

  useEffect(() => {
    streamActions.createStream();
  }, []);

  useEffect(() => {
    if (!streamHelpers.isStateReady()) {
      return;
    }

    videoRecorderActions.initialize(streamState.stream!);
  }, [streamState]);

  useEffect(() => {
    if (!videoRecorderHelpers.isStateRecording()) {
      return;
    }

    const intervalId = setInterval(async () => {
      setState((prevState) => ({ ...prevState, counter: prevState.counter + 1 }));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [videoRecorderState]);

  const onRecording = () => {
    videoRecorderActions.startRecording();

    setState((prevState) => ({ ...prevState, startedAt: Date.now() }));
  };

  const onUpload = async () => {
    const blob = await videoRecorderHelpers.getBlob();

    await uploadVideoActions.uploadVideo(blob!);
  };

  const onStopRecording = async () => {
    await videoRecorderActions.stopRecording();

    const blob = await videoRecorderHelpers.getBlob();
    const size = (await videoRecorderHelpers.getBlobSize()) ?? '0';
    const blobType = blob?.type ?? '-';

    setState((prevState) => ({ ...prevState, size, blobType }));

    if (blob && videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = URL.createObjectURL(blob);
    }
  };

  const isAppReady =
    videoState.isPlaying &&
    videoState.isLoadedMetaData &&
    streamHelpers.isStateReady() &&
    !videoRecorderHelpers.isStateIdle();

  const videoStreamSettings = streamState.stream?.getVideoTracks()[0].getSettings();

  return (
    <div className="max-w-lg mx-auto">
      <div className="-scale-x-100 relative">
        <video
          ref={videoRef}
          muted
          onPlay={videoStateActions.videoPlaying}
          autoPlay
          controls={false}
          playsInline
          loop={videoRecorderHelpers.isStateRecorded()}
          onLoadedMetadata={videoStateActions.videoLoadedMetadata}
        />

        {(videoRecorderHelpers.isStateInitialized() || videoRecorderHelpers.isStateRecording()) && (
          <p className="font-sans absolute bg-black text-white -scale-x-100 right-0 bottom-0 p-1">
            {state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0}s
          </p>
        )}
      </div>

      <div className="p-4">
        <div className="flex row-auto space-x-1.5 justify-start w-full mb-4">
          <>
            {videoRecorderHelpers.isStateInitialized() && (
              <button className="block rounded-md py-2 px-6 bg-green-300" onClick={onRecording}>
                Record
              </button>
            )}

            {videoRecorderHelpers.isStateRecording() && (
              <button className="block rounded-md py-2 px-6 bg-red-300" onClick={onStopRecording}>
                Stop Recording
              </button>
            )}

            {videoRecorderHelpers.isStateRecorded() && !uploadVideoHelpers.isStateFetched() && (
              <button className="block rounded-md py-2 px-6 bg-blue-300" onClick={onUpload}>
                Upload to cloudinary
              </button>
            )}

            {uploadVideoHelpers.isStateFetched() && (
              <a href={uploadVideoState.link!} className="block rounded-md py-2 px-6 bg-yellow-300">
                Download video
              </a>
            )}
          </>
        </div>

        <p className="w-full font-sans text-left">
          <b>Info:</b> <br />
          MimeType: video/mp4 <br />
          Video resolution: {videoStreamSettings?.width}x{videoStreamSettings?.height} <br />
          Size: {state.size} <br />
          Blob type: {state.blobType} <br />
          URL: {uploadVideoState.link ?? '-'}
        </p>
      </div>

      <div
        className={classnames('absolute inset-0 flex justify-center items-center bg-white', {
          hidden: isAppReady && !uploadVideoHelpers.isStateFetching(),
        })}
      >
        <p>{uploadVideoHelpers.isStateFetching() ? 'Uploading' : 'Loading'}...</p>
      </div>
    </div>
  );
}

export default App;
