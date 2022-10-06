import { FunctionReturnsPromise } from "./types";
import { retry as pRetry } from "./retry";

export interface ParallelLimitOptions {
  concurrency?: number;
  timeout?: number; // timeout for each promise
  retries?: number; // default is 0
  stopOnReject?: boolean;
}

export const parallel = async (
  arr: FunctionReturnsPromise[],
  {
    concurrency = Infinity,
    timeout,
    stopOnReject,
    retries = 0,
  }: ParallelLimitOptions = {}
): Promise<PromiseSettledResult<unknown>[]> => {
  if (concurrency <= 0) {
    throw new Error("concurrency must be greater than 0");
  }
  if (timeout !== undefined && timeout <= 0) {
    throw new Error("timeout should be greater than 0");
  }
  if (retries < 0) {
    throw new Error("retries should be greater than or equal to 0");
  }
  concurrency = Math.min(arr.length, concurrency);
  const result = Array(arr.length).fill(undefined);
  let index = 0;
  let count = 0;
  return new Promise((resolve, reject) => {
    const runNext = () => {
      if (count === arr.length) {
        return resolve(result);
      }
      const curIndex = index;
      index++;
      if (curIndex < arr.length) {
        const promise = pRetry(arr[curIndex], {
          retries,
          timeout,
        });
        promise
          .then((value) => {
            count++;
            result[curIndex] = {
              status: "fulfilled",
              value,
            };
            runNext();
          })
          .catch((err) => {
            count++;
            result[curIndex] = {
              status: "rejected",
              reason: err,
            };
            if (stopOnReject) {
              return resolve(result);
            }
            runNext();
          });
      }
    };

    for (let i = 0; i < concurrency; i++) {
      runNext();
    }
  });
};
