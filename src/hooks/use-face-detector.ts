import { useEffect, useState } from 'react';
import Human from '@vladmandic/human';

const human = new Human({
  backend: 'webgl',
  async: false,
  warmup: 'face',
  modelBasePath: './models/',
  face: {
    enabled: true,
    mesh: { enabled: true },
    iris: { enabled: false },
    emotion: { enabled: false },
    detector: { rotation: true, maxDetected: 1 },
    description: { enabled: false },
  },
  hand: { enabled: false },
  body: { enabled: false },
  filter: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
});

export const useFaceDetector = () => {
  const [detector, setDetector] = useState<Nullable<Human>>();

  useEffect(() => {
    const fetchDetector = async () => {
      await human.load();

      setDetector(human);
    };

    fetchDetector();
  }, []);

  return detector;
};
