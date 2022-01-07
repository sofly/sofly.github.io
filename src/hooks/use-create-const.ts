import { useRef } from 'react';

export const useCreateConst = <T>(createConst: () => T) => {
  const ref = useRef<T>();

  if (!ref.current) {
    ref.current = createConst();
  }

  return ref.current;
};
