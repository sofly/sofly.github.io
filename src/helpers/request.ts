import { RequestStateWithError } from '../types';

import { RequestState } from '../constants/request';

export const isRequestStateIdle = (state: RequestState) => state === RequestState.Idle;

export const isRequestStateFailed = (state: RequestState) => state === RequestState.Failed;

export const isRequestStateFetched = (state: RequestState) => state === RequestState.Fetched;

export const isRequestStateFetching = (state: RequestState) => state === RequestState.Fetching;

export const isRequestStateRefetching = (state: RequestState) => state === RequestState.Refetching;

export const isRequestStateLoading = (state: RequestState) =>
  isRequestStateFetching(state) || isRequestStateRefetching(state);

export const createDefaultState = (): RequestStateWithError => ({
  error: null,
  state: RequestState.Idle,
});

export const getErrorMessage = (error: any) => {
  if (typeof error?.error === 'string') {
    return error.error;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return String(error);
};
