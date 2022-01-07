import React, { useRef, useState, useEffect } from 'react';

import { getErrorMessage } from '../../helpers/request';

import { useCreateConst } from '../use-create-const';

import { StreamState } from './constants';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  streamWidth: number;
  streamHeight: number;
  capabilities?: Nullable<{
    width: number;
    height: number;
  }>;
  streamAspectRatio: number;
}

interface State {
  error: Nullable<any>;
  state: StreamState;
  stream: Nullable<MediaStream>;
  errorMessage: Nullable<string>;
}

interface Actions {
  stopStream: () => void;
  createStream: () => Promise<unknown>;
}

interface Helpers {
  isStateIdle: () => boolean;
  isStateReady: () => boolean;
  isStateFailed: () => boolean;
  isStateInitializing: () => boolean;
  isStateAccessDenied: () => boolean;
  isStateOverconstrainedError: () => boolean;
}

class CameraCapabilitiesError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'OverconstrainedError';
  }
}

const useStream = ({
  videoRef,
  streamWidth,
  streamHeight,
  streamAspectRatio,
  capabilities,
}: Props) => {
  const [state, setState] = useState<State>({
    state: StreamState.Idle,
    error: null,
    stream: null,
    errorMessage: null,
  });
  const cacheRef = useRef<State>(state);
  cacheRef.current = state;

  const actions = useCreateConst<Actions>(() => ({
    createStream: async () => {
      try {
        setState((prevState) => ({ ...prevState, state: StreamState.Initializing }));

        const stream = await window.navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: streamWidth },
            height: { ideal: streamHeight },
            aspectRatio: { ideal: streamAspectRatio },
          },
          audio: false,
        });
        cacheRef.current.stream = stream;

        if (capabilities && !import.meta.env.VITE_IS_LOCAL_BUILD) {
          const videoTrack = stream.getVideoTracks()[0];
          const cameraCapabilities = videoTrack.getCapabilities();

          if (
            (cameraCapabilities?.width?.max ?? 0) < capabilities.width ||
            (cameraCapabilities?.height?.max ?? 0) < capabilities.height
          ) {
            throw new CameraCapabilitiesError('Camera capabilities is not supported');
          }
        }

        videoRef.current!.srcObject = stream;

        setState((prevState) => ({ ...prevState, stream, state: StreamState.Ready }));
      } catch (error: any) {
        let nextState = StreamState.Failed;

        if (error?.name === 'NotAllowedError') {
          nextState = StreamState.AccessDenied;
        }

        if (error?.name === 'OverconstrainedError') {
          nextState = StreamState.OverconstrainedError;
        }

        setState((prevState) => ({
          ...prevState,
          error,
          state: nextState,
          errorMessage: getErrorMessage(error),
        }));
      }
    },

    stopStream: () => {
      cacheRef.current.stream?.getTracks().forEach((track) => track.stop());
    },
  }));

  const helpers = useCreateConst<Helpers>(() => ({
    isStateIdle: () => cacheRef.current.state === StreamState.Idle,
    isStateReady: () => cacheRef.current.state === StreamState.Ready,
    isStateFailed: () => cacheRef.current.state === StreamState.Failed,
    isStateInitializing: () => cacheRef.current.state === StreamState.Initializing,
    isStateAccessDenied: () => cacheRef.current.state === StreamState.AccessDenied,
    isStateOverconstrainedError: () => cacheRef.current.state === StreamState.OverconstrainedError,
  }));

  useEffect(() => actions.stopStream, []);

  return [state, actions, helpers] as const;
};

export type { State as UseStreamState, Actions as UseStreamActions, Helpers as UserStreamHelpers };

export { useStream, StreamState };
