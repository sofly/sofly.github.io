import { useState, useMemo } from 'react';

import { RequestState } from '../constants/request';

import {
  getErrorMessage,
  isRequestStateIdle,
  isRequestStateFailed,
  isRequestStateFetched,
  isRequestStateFetching,
} from '../helpers/request';

export const useRequestState = () => {
  const [state, setState] = useState<{
    state: RequestState;
    error: Nullable<string>;
  }>({
    state: RequestState.Idle,
    error: null,
  });

  const actions = useMemo(
    () => ({
      setToIdle: () => setState(() => ({ error: null, state: RequestState.Idle })),
      setToFailed: (error: any) => setState(() => ({ error: getErrorMessage(error), state: RequestState.Failed })),
      setToFetched: () => setState(() => ({ error: null, state: RequestState.Fetched })),
      setToFetching: () => setState(() => ({ error: null, state: RequestState.Fetching })),
    }),
    [setState],
  );

  const helpers = useMemo(
    () => ({
      isStateIdle: () => isRequestStateIdle(state.state),
      isStateFailed: () => isRequestStateFailed(state.state),
      isStateFetched: () => isRequestStateFetched(state.state),
      isStateFetching: () => isRequestStateFetching(state.state),
    }),
    [state],
  );

  return [state, actions, helpers] as const;
};
