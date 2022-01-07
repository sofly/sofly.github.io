import { useState } from 'react';

import { useCreateConst } from './use-create-const';

const DEFAULT_STATE = {
  isPlaying: false,
  isLoadedMetaData: false,
};

export const useVideoState = () => {
  const [state, setState] = useState(DEFAULT_STATE);

  const actions = useCreateConst(() => ({
    videoPlaying: () => {
      setState((prevState) => ({ ...prevState, isPlaying: true }));
    },

    videoLoadedMetadata: () => {
      setState((prevState) => ({ ...prevState, isLoadedMetaData: true }));
    },

    resetVideoState: () => setState(DEFAULT_STATE),
  }));

  return [state, actions] as const;
};
