import { FunctionReturnsPromise } from "./types";
import { isUndefinedOrNull, isNumber } from "./utils";
import { wait } from "./wait";

interface BatchOptions {
  size?: number;
  delay?: number | ((count: number) => number);
  onBatchStart?: (index: number) => void;
  onBatchEnd?: (index: number) => void;
  stopOnReject?: boolean;
  waterFall?: boolean;
  waterFallInitialValue?: any;
}

export const batch = async (
  fns: FunctionReturnsPromise[],
  {
    size,
    delay,
    onBatchStart,
    onBatchEnd,
    stopOnReject,
    waterFall = false,
    waterFallInitialValue,
  }: BatchOptions = {}
): Promise<PromiseSettledResult<unknown>[]> => {
  if (isUndefinedOrNull(size)) {
    size = fns.length;
  }
  const result: PromiseSettledResult<any>[] = [];
  for (let i = 0; i < fns.length; i += size) {
    onBatchStart?.(i);
    const promises = fns.slice(i, i + size).map((fn, index) => {
      const lastRes = result[i + index - size!];
      const nextInput = waterFall
        ? lastRes?.status === "fulfilled"
          ? lastRes?.value
          : lastRes?.reason ?? waterFallInitialValue
        : undefined;
      return fn(nextInput);
    });
    const res = await Promise.allSettled(promises);
    let hasError = false;
    for (const r of res) {
      result.push(r);
      if (!hasError && r.status === "rejected") {
        hasError = true;
      }
    }
    onBatchEnd?.(i);
    if (stopOnReject && hasError) {
      break;
    }
    if (delay) {
      if (isNumber(delay)) {
        await wait(delay);
      } else {
        await wait(delay(i));
      }
    }
  }
  return result;
};
