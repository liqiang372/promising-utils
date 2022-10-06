import { wait } from "./wait";
import { FunctionReturnsPromise } from "./types";
import { isNumber, isUndefinedOrNull, isFunction } from "./utils";
import { timeout as pTimeout } from "./timeout";

export interface RetryOptions {
  retries?: number;
  timeout?: number;
  retryIf?: (err: any, count: number) => boolean;
  retryUntil?: (err: any, count: number) => boolean;
  delay?: number | ((count: number) => number);
}

export const retry = (
  fn: FunctionReturnsPromise,
  { retries = Infinity, retryIf, retryUntil, delay, timeout }: RetryOptions = {}
) => {
  if (!isNumber(retries) || retries < 0) {
    throw new Error("retries must to be greater than or equal to 0");
  }
  if (!isUndefinedOrNull(timeout)) {
    if (!isNumber(timeout)) {
      throw new Error("timeout must be a milliseconds");
    }
    if (timeout < 0) {
      throw new Error("timeout must be greater than or equal to 0");
    }
  }
  let count = 0;
  return new Promise((resolve, reject) => {
    const fnToRun = timeout ? () => pTimeout(fn, { duration: timeout }) : fn;
    const run = () => {
      fnToRun()
        .then(resolve)
        .catch(async (err) => {
          if (count >= retries) {
            return reject(err);
          }
          if (retryIf && isFunction(retryIf) && !retryIf(err, count)) {
            return reject(err);
          }
          if (retryUntil && isFunction(retryUntil) && retryUntil(err, count)) {
            return reject(err);
          }
          count++;
          if (delay) {
            if (isNumber(delay)) {
              await wait(delay);
            } else {
              await wait(delay(count));
            }
          }
          run();
        });
    };
    run();
  });
};
