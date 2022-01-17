import React, { useState } from 'react';

import { FaceDetector } from '../../../../../../types';

import { useCreateConst } from '../../../../../../hooks/use-create-const';

import Aruco from '../../../../../../libs/aruco';
import POS from '../../../../../../libs/posit1';

import useCanvas from '../use-canvas';
import useScheduler from '../use-scheduler';

import * as canvasHelpers from './helpers/canvas';
import * as luminanceHelpers from './helpers/luminance';

import { CORRECT_IDS } from '../../constants';

const modelSize = 10.0; //millimeters

interface Props {
  width: number;
  height: number;
  videoNode: HTMLVideoElement;
  illuminationCanvasRef: React.RefObject<HTMLCanvasElement>;
}

function drawCorners({ markers, context }: any) {
  var corners, corner, i, j;

  context.lineWidth = 3;

  for (i = 0; i < markers.length; ++i) {
    corners = markers[i].corners;

    context.strokeStyle = 'red';
    context.beginPath();

    for (j = 0; j < corners.length; ++j) {
      corner = corners[j];
      context.moveTo(corner.x, corner.y);
      corner = corners[(j + 1) % corners.length];
      context.lineTo(corner.x, corner.y);
    }

    context.stroke();
    context.closePath();

    context.strokeStyle = 'green';
    context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
  }
}

const useIllumination = ({ width, height, videoNode, illuminationCanvasRef }: Props) => {
  const [state, setState] = useState<{
    uniqIds: number[];
    ids: number[];
    time: number;
    rotation: {
      yaw: number;
      roll: number;
      pitch: number;
    };
    countOfSuccess: number;
  }>({
    ids: [],
    uniqIds: [],
    time: 0,
    rotation: {
      yaw: 0,
      roll: 0,
      pitch: 0,
    },
    countOfSuccess: 0,
  });
  const [, schedulerActions] = useScheduler();

  const pos: any = useCreateConst(() => new POS.Posit(modelSize, width));
  const detector: any = useCreateConst(
    () =>
      new Aruco.Detector({
        dictionaryName: 'ARUCO',
      }),
  );

  const [, imageCanvasCtx] = useCanvas({ width, height });

  const detect = useCreateConst(() => async () => {
    const startedAt = Date.now();
    const illuminationCanvas = illuminationCanvasRef.current;
    const illuminationCanvasCtx = illuminationCanvas?.getContext('2d')!;

    canvasHelpers.clear({ ctx: illuminationCanvasCtx, width, height });
    canvasHelpers.drawImage({ ctx: imageCanvasCtx, input: videoNode });

    const imageData = imageCanvasCtx.getImageData(0, 0, width, height);
    const markers = detector.detect(imageData);

    if (markers.length) {
      var corners, corner, pose, i;

      corners = markers[0].corners;

      for (i = 0; i < corners.length; ++i) {
        corner = corners[i];

        corner.x = corner.x - width / 2;
        corner.y = height / 2 - corner.y;
      }

      pose = pos.pose(corners);

      const bestRotation = {
        yaw: -Math.atan2(pose.bestRotation[0][2], pose.bestRotation[2][2]) * (180 / Math.PI),
        roll: Math.atan2(pose.bestRotation[1][0], pose.bestRotation[1][1]) * (180 / Math.PI),
        pitch: -Math.asin(-pose.bestRotation[1][2]) * (180 / Math.PI),
      };

      drawCorners({ markers, context: illuminationCanvasCtx });
      const ids = markers.map(({ id }: any) => id) as number[];

      setState((prevState) => ({
        ...prevState,
        ids,
        time: Date.now() - startedAt,
        uniqIds: [...new Set([...prevState.uniqIds, ...ids])],
        rotation: bestRotation,
        countOfSuccess: prevState.countOfSuccess + (CORRECT_IDS.every((id) => ids.includes(id)) ? 1 : 0),
      }));
    }
  });

  const actions = useCreateConst(() => ({
    detect: () => {
      schedulerActions.run(detect);
    },

    stopDetecting: () => {
      schedulerActions.stop();
    },
  }));

  return [state, actions] as const;
};

export default useIllumination;
