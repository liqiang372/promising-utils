import { wait } from "../src/wait";

export class ResolvedPromise {
  public calledTimes = 0;
  public isRunning = false;
  constructor() {}

  run(
    duration: number,
    result: string,
    { onResolved }: { onResolved?: (result: string) => void } = {}
  ): Promise<string> {
    this.calledTimes++;
    this.isRunning = true;
    return wait(duration).then(() => {
      this.isRunning = false;
      onResolved?.(result);
      return result;
    });
  }
}

export class RejectedPromise {
  public calledTimes = 0;
  public isRunning = false;
  constructor() {}

  run(
    duration: number,
    msg: string,
    { onRejected }: { onRejected?: (msg: string) => void } = {}
  ): Promise<string> {
    this.calledTimes++;
    this.isRunning = true;
    return wait(duration).then(() => {
      this.isRunning = false;
      onRejected?.(msg);
      throw new Error(msg);
    });
  }
}

export function flushPromises() {
  return new Promise((resolve) =>
    jest.requireActual("timers").setImmediate(resolve)
  );
}
