import { RequestState } from './constants/request';

export type Nullable<T> = T | null | undefined;

export type RequestStateWithError = {
  error: Nullable<string>;
  state: RequestState;
};

export type Point = [number, number, number?];

export type FaceMesh = {
  lips: Point[];
  nose: Point[];
  leftEye: Point[];
  rightEye: Point[];
  silhouette: Point[];
};

export type FaceDetector = {
  detect: (video: HTMLVideoElement) => Promise<FaceMesh | null>;
};
