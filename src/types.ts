import { RequestState } from './constants/request';

export type Nullable<T> = T | null | undefined;

export type RequestStateWithError = {
  error: Nullable<string>;
  state: RequestState;
};
