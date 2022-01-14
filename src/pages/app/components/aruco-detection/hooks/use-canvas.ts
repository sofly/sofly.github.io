import { useCreateConst } from '../../../../../hooks/use-create-const';

interface Props {
  width: number;
  height: number;
}

const useCanvas = ({ width, height }: Props) =>
  useCreateConst(() => {
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    return [canvas, canvas.getContext('2d')!] as const;
  });

export default useCanvas;
