import { FaceResult } from '@vladmandic/human';

export const createD = (points: [number, number, number?][]) => {
  if (
    points[0][0] !== points[points.length - 1][0] ||
    points[0][1] !== points[points.length - 1][1]
  ) {
    points.push(points[0]);
  }

  return points.reduce((d, [x, y], index) => {
    if (index === 0) {
      return `${d}M ${x} ${y} `;
    }

    if (points.length - 1 === index) {
      return `${d}L ${x} ${y} Z `;
    }

    return `${d}L ${x} ${y} `;
  }, '');
};

export const drawImage = ({
  ctx,
  input,
}: {
  ctx: CanvasRenderingContext2D;
  input: HTMLVideoElement;
}) => ctx.drawImage(input, 0, 0);

export const fill = ({
  ctx,
  width,
  height,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}) => {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
};

export const drawPathByPoints = ({
  ctx,
  fill = 'black',
  points,
}: {
  ctx: CanvasRenderingContext2D;
  fill?: string;
  points: [number, number, number?][];
}) => {
  let p = new Path2D(createD(points));

  ctx.fillStyle = fill;
  ctx.fill(p);
};

export const drawFace = ({
  ctx,
  prediction: { annotations },
}: {
  ctx: CanvasRenderingContext2D;
  prediction: FaceResult;
}) => {
  drawPathByPoints({ ctx, fill: 'white', points: annotations.silhouette });

  [
    [annotations.noseBottom[0], annotations.noseLeftCorner[0], annotations.noseRightCorner[0]],
    annotations.lipsLowerInner,
    annotations.lipsUpperInner,
    annotations.leftEyebrowUpper,
    annotations.leftEyebrowLower,
    annotations.rightEyebrowUpper,
    annotations.rightEyebrowLower,
    annotations.lipsLowerOuter,
    annotations.lipsUpperOuter,
    annotations.leftEyeUpper1,
    annotations.rightEyeUpper1,
    annotations.leftEyeLower1,
    annotations.rightEyeLower1,
  ]
    .filter((points) => !points.some((point) => !point))
    .forEach((points) => drawPathByPoints({ ctx, points }));
};
