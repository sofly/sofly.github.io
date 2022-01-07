import { useRef, useState } from 'react';
import Human from '@vladmandic/human';

import { useCreateConst } from '../../../../../../hooks/use-create-const';

import useCanvas from '../use-canvas';
import useScheduler from '../use-scheduler';

import * as canvasHelpers from './helpers/canvas';
import * as luminanceHelpers from './helpers/luminance';

interface Props {
  width: number;
  height: number;
  videoNode: HTMLVideoElement;
  faceDetector: Human;
}

const useIllumination = ({ width, height, videoNode, faceDetector }: Props) => {
  const [state, setState] = useState({
    shadowValue: 0,
    saturationValue: 0,
    shadowImageMask: '',
    saturationImageMask: '',
  });
  const [, schedulerActions] = useScheduler();

  const [maskCanvas, maskCanvasCtx] = useCanvas({ width, height });
  const [imageCanvas, imageCanvasCtx] = useCanvas({ width, height });
  const [shadowCanvas, shadowCanvasCtx] = useCanvas({ width, height });
  const [saturationCanvas, saturationCanvasCtx] = useCanvas({ width, height });

  const check = useCreateConst(() => async () => {
    const result = await faceDetector.detect(videoNode);

    if (!!result && result.face.length > 0 && result.face[0].mesh.length > 0) {
      const prediction = result.face[0];

      canvasHelpers.drawImage({ ctx: imageCanvasCtx, input: videoNode });

      canvasHelpers.fill({ ctx: maskCanvasCtx, width, height });
      canvasHelpers.fill({ ctx: shadowCanvasCtx, width, height });
      canvasHelpers.fill({ ctx: saturationCanvasCtx, width, height });

      canvasHelpers.drawFace({ ctx: maskCanvasCtx, prediction });

      const luminanceData = luminanceHelpers.createLuminanceData({
        width,
        height,
        maskCtx: maskCanvasCtx,
        imageCtx: imageCanvasCtx,
      });

      const { shadowPixels, saturationPixels, shadowImageMask, saturationImageMask } =
        luminanceHelpers.generateMasks({
          threshold: luminanceData.threshold,
          shadowCanvas,
          shadowCanvasCtx,
          saturationCanvas,
          saturationCanvasCtx,
          luminanceImageMap: luminanceData.luminanceImageMap,
        });

      setState((prevState) => ({
        ...prevState,
        shadowValue: shadowPixels / luminanceData.pixelsInFace,
        saturationValue: saturationPixels / luminanceData.pixelsInFace,
        shadowImageMask,
        saturationImageMask,
      }));
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
