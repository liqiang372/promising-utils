import { parallel } from "../src/parallel";
import { ResolvedPromise, RejectedPromise, flushPromises } from "./testUtils";

describe("parallel", () => {
  let fn1: ResolvedPromise;
  let fn2: ResolvedPromise;
  let fn3: ResolvedPromise;
  let fn4: ResolvedPromise;
  let fn5: RejectedPromise;
  let fn6: RejectedPromise;
  beforeEach(() => {
    fn1 = new ResolvedPromise();
    fn2 = new ResolvedPromise();
    fn3 = new ResolvedPromise();
    fn4 = new ResolvedPromise();
    fn5 = new RejectedPromise();
    fn6 = new RejectedPromise();
  });

  test("should work without passing concurrency", async () => {
    const arr = [
      () => fn1.run(100, "success_1"),
      () => fn2.run(20, "success_2"),
      () => fn3.run(80, "success_3"),
    ];

    const expected = [
      {
        status: "fulfilled",
        value: "success_1",
      },
      {
        status: "fulfilled",
        value: "success_2",
      },
      {
        status: "fulfilled",
        value: "success_3",
      },
    ];
    expect(await parallel(arr)).toEqual(expected);
  });

  test("should work passing concurrency", async () => {
    const arr = [
      () => fn1.run(100, "success_1"),
      () => fn2.run(20, "success_2"),
      () => fn3.run(80, "success_3"),
    ];
    const expected = [
      {
        status: "fulfilled",
        value: "success_1",
      },
      {
        status: "fulfilled",
        value: "success_2",
      },
      {
        status: "fulfilled",
        value: "success_3",
      },
    ];
    expect(await parallel(arr, { concurrency: 1 })).toEqual(expected);
    expect(await parallel(arr, { concurrency: 2 })).toEqual(expected);
    expect(await parallel(arr, { concurrency: 3 })).toEqual(expected);
    expect(await parallel(arr, { concurrency: 4 })).toEqual(expected);
  });

  test("should always run at maximum concurrency", async () => {
    let count = 0;
    let counts: number[] = [];
    const updateCount = () => {
      count++;
      counts.push(count);
    };
    const arr = [
      () => {
        updateCount();
        return fn1.run(100, "success_1", {
          onResolved: () => {
            count--;
          },
        });
      },
      () => {
        updateCount();
        return fn2.run(20, "success_2", {
          onResolved: () => {
            count--;
          },
        });
      },
      () => {
        updateCount();
        return fn1.run(80, "success_3", {
          onResolved: () => {
            count--;
          },
        });
      },
      () => {
        updateCount();
        return fn1.run(120, "success_4", {
          onResolved: () => {
            count--;
          },
        });
      },
    ];
    const res = await parallel(arr, { concurrency: 2 });
    expect(counts).toHaveLength(arr.length);
    expect(counts).toEqual([1, 2, 2, 2]);
    const expected = [
      {
        status: "fulfilled",
        value: "success_1",
      },
      {
        status: "fulfilled",
        value: "success_2",
      },
      {
        status: "fulfilled",
        value: "success_3",
      },
      {
        status: "fulfilled",
        value: "success_4",
      },
    ];
    expect(res).toEqual(expected);
  });
  test("should work with promise rejections", async () => {
    const arr = [
      () => fn1.run(100, "success_1"),
      () => fn2.run(20, "success_2"),
      () => fn3.run(80, "success_3"),
      () => fn5.run(60, "fail_5"),
      () => fn6.run(110, "fail_6"),
      () => fn4.run(120, "success_4"),
    ];
    const expected = [
      {
        status: "fulfilled",
        value: "success_1",
      },
      {
        status: "fulfilled",
        value: "success_2",
      },
      {
        status: "fulfilled",
        value: "success_3",
      },
      {
        status: "rejected",
        reason: new Error("fail_5"),
      },
      {
        status: "rejected",
        reason: new Error("fail_6"),
      },
      {
        status: "fulfilled",
        value: "success_4",
      },
    ];
    const res = await parallel(arr, { concurrency: 2 });
    expect(res).toEqual(expected);
  });

  test("should stopOnReject work", async () => {
    const arr = [
      () => fn1.run(100, "success_1"),
      () => fn2.run(20, "success_2"),
      () => fn3.run(80, "success_3"),
      () => fn5.run(60, "fail_5"),
      () => fn6.run(110, "fail_6"),
      () => fn4.run(120, "success_4"),
    ];
    const expected = [
      {
        status: "fulfilled",
        value: "success_1",
      },
      {
        status: "fulfilled",
        value: "success_2",
      },
      {
        status: "fulfilled",
        value: "success_3",
      },
      {
        status: "rejected",
        reason: new Error("fail_5"),
      },
    ];
    const res = await parallel(arr, {
      concurrency: 1,
      stopOnReject: true,
    });
    expect(res).toEqual(expected);
  });

  test("should timeout work", async () => {
    const arr = [
      () => fn1.run(100, "success_1"),
      () => fn2.run(20, "success_2"),
      () => fn3.run(80, "success_3"),
      () => fn5.run(60, "fail_5"),
      () => fn6.run(110, "fail_6"),
      () => fn4.run(120, "success_4"),
    ];

    const TIMED_OUT_MSG = "timed out after 90 milliseconds";
    const expected = [
      {
        status: "rejected",
        reason: new Error(TIMED_OUT_MSG),
      },
      {
        status: "fulfilled",
        value: "success_2",
      },
      {
        status: "fulfilled",
        value: "success_3",
      },
      {
        status: "rejected",
        reason: new Error("fail_5"),
      },
      {
        status: "rejected",
        reason: new Error(TIMED_OUT_MSG),
      },
      {
        status: "rejected",
        reason: new Error(TIMED_OUT_MSG),
      },
    ];
    const res = await parallel(arr, {
      concurrency: 2,
      timeout: 90,
    });
    expect(res).toEqual(expected);
  });

  test("should retry work", async () => {
    const arr = [
      () => fn1.run(100, "success_1"),
      () => fn2.run(20, "success_2"),
      () => fn3.run(80, "success_3"),
      () => fn5.run(60, "fail_5"),
      () => fn6.run(110, "fail_6"),
      () => fn4.run(120, "success_4"),
    ];

    const TIMED_OUT_MSG = "timed out after 90 milliseconds";
    const expected = [
      {
        status: "rejected",
        reason: new Error(TIMED_OUT_MSG),
      },
      {
        status: "fulfilled",
        value: "success_2",
      },
      {
        status: "fulfilled",
        value: "success_3",
      },
      {
        status: "rejected",
        reason: new Error("fail_5"),
      },
      {
        status: "rejected",
        reason: new Error(TIMED_OUT_MSG),
      },
      {
        status: "rejected",
        reason: new Error(TIMED_OUT_MSG),
      },
    ];
    const res = await parallel(arr, {
      concurrency: 2,
      timeout: 90,
      retries: 2,
    });
    expect(res).toEqual(expected);
    expect(fn1.calledTimes).toBe(3);
    expect(fn2.calledTimes).toBe(1);
    expect(fn3.calledTimes).toBe(1);
    expect(fn4.calledTimes).toBe(3);
    expect(fn4.calledTimes).toBe(3);
    expect(fn6.calledTimes).toBe(3);
  });
});
