import { useRef } from 'react';

import { useCreateConst } from '../../../../../hooks/use-create-const';

const useScheduler = () => {
  const cache = useRef({
    isRunning: false,
    shouldStop: false,
  });

  const resetCache = () => {
    cache.current.isRunning = false;
    cache.current.shouldStop = false;
  };

  const actions = useCreateConst(() => ({
    run: (cb: () => Promise<unknown>) => {
      if (cache.current.isRunning) {
        return;
      }

      cache.current.isRunning = true;

      let previousAnimationTimeStamp: null | number = null;

      async function run(timestamp = 0) {
        if (cache.current.shouldStop) {
          resetCache();

          return;
        }

        const diff = timestamp - (previousAnimationTimeStamp ?? 0);

        if (previousAnimationTimeStamp === null || diff > 16) {
          await cb();

          if (cache.current.shouldStop) {
            resetCache();

            return;
          }

          previousAnimationTimeStamp = timestamp;
        }

        window.requestAnimationFrame(run);
      }

      run();
    },

    stop: () => {
      cache.current.shouldStop = true;
    },
  }));

  return [cache.current.isRunning, actions] as const;
};

export default useScheduler;
