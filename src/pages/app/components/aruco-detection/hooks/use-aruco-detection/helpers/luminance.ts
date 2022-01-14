import * as canvasHelpers from './canvas';

const redCondition = 250 / 255;
const medianCondition = 225 / 255;

const isSaturationHigh = (r: number, rgbMedian: number) => {
  if (rgbMedian > medianCondition || r > redCondition) {
    return 1;
  }

  return 0;
};

export const createLuminanceData = ({
  width,
  height,
  maskCtx,
  imageCtx,
}: {
  width: number;
  height: number;
  maskCtx: CanvasRenderingContext2D;
  imageCtx: CanvasRenderingContext2D;
}) => {
  const luminanceFace: number[] = [];

  const { data: maskData } = maskCtx.getImageData(0, 0, width, height);
  const { data: imageData } = imageCtx.getImageData(0, 0, width, height);

  const rowSize = width * 4;
  let rowOffset,
    x = 0,
    y = 0,
    index = 0,
    r,
    g,
    b,
    newR,
    newG,
    newB,
    rgbMedian,
    luminance,
    pixelsInFace = 0,
    totalIlluminance = 0,
    maxFaceIlluminance = 0,
    maxBackgroundIlluminance = 0,
    backgroundSaturationPixels = 0;

  for (; x < width; x += 1) {
    rowOffset = x * 4;
    y = 0;

    for (; y < height; y += 1) {
      index = y * rowSize + rowOffset;

      r = imageData[index] / 255;
      g = imageData[index + 1] / 255;
      b = imageData[index + 2] / 255;

      newR = r * 0.299;
      newG = g * 0.587;
      newB = b * 0.114;

      rgbMedian = (r * g * b) / 3;
      luminance = newR + newG + newB;

      totalIlluminance += luminance;

      const pixelSaturation = isSaturationHigh(r, rgbMedian);

      // if pixel of background
      if (maskData[index] === 0) {
        if (maxBackgroundIlluminance < rgbMedian) {
          maxBackgroundIlluminance = rgbMedian;
        }

        backgroundSaturationPixels += pixelSaturation;
      } else {
        luminanceFace.push(x, y, pixelSaturation, luminance);

        pixelsInFace += 1;

        if (maxFaceIlluminance < rgbMedian) {
          maxFaceIlluminance = rgbMedian;
        }
      }
    }
  }

  const averageIlluminance = totalIlluminance / (width * height);
  let shadowThreshold = maxBackgroundIlluminance;

  if (averageIlluminance > 0.4) {
    shadowThreshold = maxFaceIlluminance;
  } else if (maxBackgroundIlluminance < 0.3) {
    shadowThreshold = 0.3;
  }

  return {
    pixelsInFace,
    luminanceFace,
    shadowThreshold,
    maxFaceIlluminance,
    maxBackgroundIlluminance,
    backgroundSaturationPixels,
  };
};

export const generateMasks = ({
  width,
  height,
  luminanceFace,
  shadowThreshold,
  illuminationCanvasCtx,
}: {
  width: number;
  height: number;
  luminanceFace: number[];
  shadowThreshold: number;
  illuminationCanvasCtx: CanvasRenderingContext2D;
}) => {
  let shadowPixels = 0;
  let saturationPixels = 0;

  canvasHelpers.clear({ ctx: illuminationCanvasCtx, width, height });

  const { length } = luminanceFace;
  let i = 0;

  for (; i < length; i += 4) {
    // shadow
    if (luminanceFace[i + 3] < shadowThreshold) {
      shadowPixels += 1;

      illuminationCanvasCtx.fillStyle = 'rgba(86, 29, 247, 1)';
      illuminationCanvasCtx.fillRect(luminanceFace[i], luminanceFace[i + 1], 1, 1);
    }

    //saturation
    if (luminanceFace[i + 2] === 1) {
      saturationPixels += 1;

      illuminationCanvasCtx.fillStyle = 'rgba(255, 182, 171, 1)';
      illuminationCanvasCtx.fillRect(luminanceFace[i], luminanceFace[i + 1], 1, 1);
    }
  }

  return {
    shadowPixels,
    saturationPixels,
  };
};
