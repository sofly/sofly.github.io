import React, { useState } from 'react';

import { FaceDetector } from '../../../../../../types';

import { useCreateConst } from '../../../../../../hooks/use-create-const';

import useCanvas from '../use-canvas';
import useScheduler from '../use-scheduler';

import * as canvasHelpers from './helpers/canvas';
import * as luminanceHelpers from './helpers/luminance';

interface Props {
  width: number;
  height: number;
  videoNode: HTMLVideoElement;
  faceDetector: FaceDetector;
  illuminationCanvasRef: React.RefObject<HTMLCanvasElement>;
}

const useIllumination = ({ width, height, videoNode, faceDetector, illuminationCanvasRef }: Props) => {
  const [state, setState] = useState({
    algorithmMs: 0,
    shadowValue: 0,
    faceDetectionMs: 0,
    saturationValue: 0,
    shadowImageMask: '',
    saturationImageMask: '',
    backgroundSaturationValue: 0,
  });
  const [, schedulerActions] = useScheduler();

  const [, maskCanvasCtx] = useCanvas({ width, height });
  const [, imageCanvasCtx] = useCanvas({ width, height });

  const check = useCreateConst(() => async () => {
    const illuminationCanvas = illuminationCanvasRef.current;
    const illuminationCanvasCtx = illuminationCanvas?.getContext('2d')!;

    const faceMesh = await faceDetector.detect(videoNode);

    if (!!faceMesh) {
      const startAt = Date.now();

      canvasHelpers.drawImage({ ctx: imageCanvasCtx, input: videoNode });

      canvasHelpers.fill({ ctx: maskCanvasCtx, width, height });
      canvasHelpers.drawFace({ ctx: maskCanvasCtx, faceMesh });

      const luminanceData = luminanceHelpers.createLuminanceData({
        width,
        height,
        maskCtx: maskCanvasCtx,
        imageCtx: imageCanvasCtx,
      });

      console.log(luminanceData.shadowThreshold);

      const { shadowPixels, saturationPixels } = luminanceHelpers.generateMasks({
        width,
        height,
        luminanceFace: luminanceData.luminanceFace,
        shadowThreshold: luminanceData.shadowThreshold,
        illuminationCanvasCtx,
      });

      onIlluminationChange({
        shadowValue: shadowPixels / luminanceData.pixelsInFace,
        saturationValue: saturationPixels / luminanceData.pixelsInFace,
        backgroundSaturationValue:
          luminanceData.saturationPixelsInBackground / (width * height - luminanceData.pixelsInFace),
      });
    } else {
      onIlluminationChange(null);
    }
  });

  const actions = useCreateConst(() => ({
    check: () => {
      schedulerActions.run(check);
    },

    stopChecking: () => {
      schedulerActions.stop();
    },
  }));

  return [state, actions] as const;
};

export default useIllumination;
