import { getId } from '../helpers/id';

import { useCreateConst } from './use-create-const';

export const useId = (): number => useCreateConst(() => getId());

export const useIds = (count: number): number[] =>
  useCreateConst(() => Array.from(new Array(count), () => getId()));
