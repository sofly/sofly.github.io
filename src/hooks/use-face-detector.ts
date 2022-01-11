import { useEffect, useState } from 'react';

import '@mediapipe/face_mesh';

import type { Results, FaceMesh, LandmarkConnectionArray } from '@mediapipe/face_mesh';

// import Human from '@vladmandic/human';

import type { FaceDetector, Point, FaceMesh as IFaceMesh } from '../types';

// const human = new Human({
//   backend: 'webgl',
//   async: false,
//   warmup: 'face',
//   modelBasePath: './models/',
//   face: {
//     enabled: true,
//     mesh: { enabled: true },
//     iris: { enabled: false },
//     emotion: { enabled: false },
//     detector: { rotation: true, maxDetected: 1 },
//     description: { enabled: false },
//   },
//   hand: { enabled: false },
//   body: { enabled: false },
//   filter: { enabled: false },
//   object: { enabled: false },
//   gesture: { enabled: false },
// });

declare global {
  interface Window {
    FaceMesh: typeof FaceMesh;
    FACEMESH_LIPS: LandmarkConnectionArray;
    FACEMESH_LEFT_EYE: LandmarkConnectionArray;
    FACEMESH_LEFT_EYEBROW: LandmarkConnectionArray;
    FACEMESH_LEFT_IRIS: LandmarkConnectionArray;
    FACEMESH_RIGHT_EYE: LandmarkConnectionArray;
    FACEMESH_RIGHT_EYEBROW: LandmarkConnectionArray;
    FACEMESH_RIGHT_IRIS: LandmarkConnectionArray;
    FACEMESH_FACE_OVAL: LandmarkConnectionArray;
  }
}

const LIPS_HOLE = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const LEFT_EYE_HOLE = [130, 113, 124, 156, 70, 63, 105, 66, 107, 55, 221, 189, 244, 243, 112, 26, 22, 23, 24, 110, 25];
const RIGHT_EYE_HOLE = [
  359, 255, 339, 254, 253, 252, 256, 341, 463, 464, 413, 441, 285, 336, 296, 334, 293, 300, 383, 353, 342,
];
const NOSE_HOLE = [166, 60, 99, 97, 2, 326, 328, 290, 392, 309, 458, 461, 354, 19, 125, 241, 238, 79];

function transportCreator<T>() {
  let resolver: Nullable<(data: T) => void> = null;

  return {
    push: (data: T) => {
      if (!resolver) {
        return;
      }

      const r = resolver!;
      resolver = null;

      setTimeout(() => {
        r(data);
      }, 0);
    },

    pull: () =>
      new Promise<T>((resolve, reject) => {
        resolver = resolve;
      }),
  };
}

export const useFaceDetector = () => {
  const [detector, setDetector] = useState<Nullable<FaceDetector>>();

  useEffect(() => {
    const fetchDetector = async () => {
      // await human.load();

      const faceMesh = new window.FaceMesh({
        locateFile: (file: any) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,

        minTrackingConfidence: 0.3,
        minDetectionConfidence: 0.3,
      });

      const transport = transportCreator<Results>();

      faceMesh.onResults((results: Results) => transport.push(results));

      await faceMesh.initialize();

      setDetector({
        detect: async (videoElement: HTMLVideoElement): Promise<IFaceMesh | null> => {
          faceMesh.send({ image: videoElement });

          const result = await transport.pull();

          if (!result.multiFaceLandmarks[0]) {
            return null;
          }

          const { videoWidth, videoHeight } = videoElement;
          const points: Point[] = result.multiFaceLandmarks[0].map((point) => [
            point.x * videoWidth,
            point.y * videoHeight,
          ]);

          return {
            lips: LIPS_HOLE.map((i) => points[i]),
            nose: NOSE_HOLE.map((i) => points[i]),
            leftEye: LEFT_EYE_HOLE.map((i) => points[i]),
            rightEye: RIGHT_EYE_HOLE.map((i) => points[i]),
            silhouette: window.FACEMESH_FACE_OVAL.map(([i]) => points[i]),
          };
        },
      });
    };

    fetchDetector();
  }, []);

  return detector;
};
