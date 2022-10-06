import { batch } from "./batch";
import { FunctionReturnsPromise } from "./types";
import { isUndefinedOrNull, isNumber } from "./utils";
import { wait } from "./wait";

interface SeriesOptions {
  delay?: number | ((count: number) => number);
  onEachStart?: (index: number) => void;
  onEachEnd?: (index: number) => void;
  stopOnReject?: boolean;
  waterFall?: boolean;
  waterFallInitialValue?: any;
}

/**
 * Series is basically batch with size 1
 */
export const series = async (
  fns: FunctionReturnsPromise[],
  {
    delay,
    stopOnReject,
    waterFall,
    onEachStart,
    onEachEnd,
    waterFallInitialValue,
  }: SeriesOptions = {}
): Promise<PromiseSettledResult<unknown>[]> => {
  return batch(fns, {
    size: 1,
    onBatchStart: onEachStart,
    onBatchEnd: onEachEnd,
    delay,
    stopOnReject,
    waterFall,
    waterFallInitialValue,
  });
};
