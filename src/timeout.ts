import { FunctionReturnsPromise } from "./types";

export interface TimeoutOptions {
  duration?: number;
  timeoutMsg?: string;
}
export const timeout = (
  fn: FunctionReturnsPromise,
  { duration = Infinity, timeoutMsg }: TimeoutOptions
) => {
  return new Promise((resolve, reject) => {
    let timer: any = undefined;

    if (Number.isFinite(duration)) {
      timeoutMsg = timeoutMsg ?? `timed out after ${duration} milliseconds`;
      timer = setTimeout(() => {
        reject(new Error(timeoutMsg));
      }, duration);
    }
    fn()
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};
