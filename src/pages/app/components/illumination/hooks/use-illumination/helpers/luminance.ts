type LuminanceImageMap = Map<
  [number, number],
  {
    r: number;
    g: number;
    b: number;
    luminance: number;
  }
>;

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
  let threshold = 0;
  let pixelsInFace = 0;

  const luminanceImageMap: LuminanceImageMap = new Map();

  for (let y = 0; y < height; y += 1) {
    const { data: maskData } = maskCtx.getImageData(0, y, width, 1);
    const { data: imageData } = imageCtx.getImageData(0, y, width, 1);

    for (let x = 0; x < width; x += 1) {
      const index = x * 4;

      if (maskData[index] === 0) {
        continue;
      }

      const r = imageData[index] / 255;
      const g = imageData[index + 1] / 255;
      const b = imageData[index + 2] / 255;

      const newR = r * 0.299;
      const newG = g * 0.587;
      const newB = b * 0.114;

      luminanceImageMap.set([x, y], { r, g, b, luminance: newR + newG + newB });

      threshold = Math.max(threshold, (r * g * b) / 3);

      pixelsInFace += 1;
    }
  }

  return {
    threshold,
    pixelsInFace,
    luminanceImageMap,
  };
};

export const generateMasks = ({
  threshold,
  shadowCanvas,
  shadowCanvasCtx,
  saturationCanvas,
  luminanceImageMap,
  saturationCanvasCtx,
}: {
  threshold: number;
  shadowCanvas: HTMLCanvasElement;
  shadowCanvasCtx: CanvasRenderingContext2D;
  saturationCanvas: HTMLCanvasElement;
  luminanceImageMap: LuminanceImageMap;
  saturationCanvasCtx: CanvasRenderingContext2D;
}) => {
  let shadowPixels = 0;
  let saturationPixels = 0;

  shadowCanvasCtx.fillStyle = '#fff';
  saturationCanvasCtx.fillStyle = '#fff';

  for (const [[x, y], { luminance, r, g, b }] of luminanceImageMap) {
    // shadow
    if (luminance < threshold) {
      shadowPixels += 1;

      shadowCanvasCtx.fillRect(x, y, 1, 1);
    }

    //saturation

    const redCondition = 250 / 255;

    const median = (r + g + b) / 3;
    const medianCondition = 225 / 255;

    if (median > medianCondition || r > redCondition) {
      saturationCanvasCtx.fillRect(x, y, 1, 1);

      saturationPixels += 1;
    }
  }

  const shadowImageMask = shadowCanvas.toDataURL();
  const saturationImageMask = saturationCanvas.toDataURL();

  return {
    shadowPixels,
    saturationPixels,
    shadowImageMask,
    saturationImageMask,
  };
};
