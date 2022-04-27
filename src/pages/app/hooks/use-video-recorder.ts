import { useRef, useMemo, useState } from 'react';
import { bytesToSize, MediaStreamRecorder, RecordRTCPromisesHandler } from 'recordrtc';

import { useCreateConst } from '../../../hooks/use-create-const';

export enum State {
  IDLE = 'idle',
  INITIALIZED = 'initialized',
  RECORDING = 'recording',
  RECORDED = 'recorded',
}

interface VideoRecorderState {
  error: Nullable<any>;
  state: State;
  recorder: Nullable<RecordRTCPromisesHandler>;
}

const DEFAULT_STATE = {
  error: null,
  state: State.IDLE,
  recorder: null,
};

export const useVideoRecorder = () => {
  const [state, setState] = useState<VideoRecorderState>(DEFAULT_STATE);
  const cacheRef = useRef(state);
  cacheRef.current = state;

  const actions = useCreateConst(() => ({
    reset: () => setState(DEFAULT_STATE),

    initialize: (stream: MediaStream) => {
      let error: Nullable<any> = null;
      let recorder: Nullable<RecordRTCPromisesHandler> = null;

      try {
        recorder = new RecordRTCPromisesHandler(stream, {
          type: 'video',
          mimeType: 'video/webm;codecs=vp8',
          recorderType: MediaStreamRecorder,
        });
      } catch (e) {
        error = e;
      }

      setState((prevState) => ({
        ...prevState,
        error,
        state: State.INITIALIZED,
        recorder,
      }));
    },

    startRecording: async () => {
      await cacheRef.current.recorder?.startRecording();

      setState((prevState) => ({ ...prevState, state: State.RECORDING }));
    },

    stopRecording: async () => {
      await cacheRef.current.recorder?.stopRecording();

      setState((prevState) => ({ ...prevState, state: State.RECORDED }));
    },
  }));

  const helpers = useCreateConst(() => ({
    isStateIdle: () => cacheRef.current.state === State.IDLE,
    isStateInitialized: () => cacheRef.current.state === State.INITIALIZED,
    isStateRecording: () => cacheRef.current.state === State.RECORDING,
    isStateRecorded: () => cacheRef.current.state === State.RECORDED,

    getBlob: () => cacheRef.current.recorder?.getBlob(),

    getBlobSize: async () => {
      const blob = await cacheRef.current.recorder?.getBlob();

      if (!blob) {
        return null;
      }

      return bytesToSize(blob.size);
    },
  }));

  const publicState = useMemo(() => {
    const cloneState = { ...state };

    delete cloneState.recorder;

    return cloneState;
  }, [state]);

  return [publicState, actions, helpers] as const;
};
