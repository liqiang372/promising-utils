import { batch } from "../src";
import { RejectedPromise, ResolvedPromise } from "./testUtils";

describe("batch", () => {
  let startStub;
  let endStub;
  let f1: ResolvedPromise;
  let f2: ResolvedPromise;
  let f3: RejectedPromise;
  let f4: RejectedPromise;
  let f5: ResolvedPromise;
  beforeEach(() => {
    startStub = jest.fn();
    endStub = jest.fn();
    f1 = new ResolvedPromise();
    f2 = new ResolvedPromise();
    f3 = new RejectedPromise();
    f4 = new RejectedPromise();
    f5 = new ResolvedPromise();
  });
  test("should batch work", async () => {
    const res = await batch(
      [
        () => f1.run(100, "success_1"),
        () => f2.run(50, "success_2"),
        () => f3.run(80, "fail_3"),
        () => f4.run(110, "fail_4"),
        () => f5.run(110, "success_5"),
      ],
      {
        size: 2,
        onBatchStart: startStub,
        onBatchEnd: endStub,
      }
    );
    expect(res).toHaveLength(5);
    expect(res.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(res[0].status).toBe("fulfilled");
    expect((res[0] as PromiseFulfilledResult<string>).value).toBe("success_1");
    expect(res.filter((r) => r.status === "rejected")).toHaveLength(2);
    expect(res[2].status).toBe("rejected");
    expect((res[2] as PromiseRejectedResult).reason).toEqual(
      new Error("fail_3")
    );
    expect(startStub).toHaveBeenCalledTimes(3);
    expect(endStub).toHaveBeenCalledTimes(3);
  });

  test("should terminate when stopOnReject is set", async () => {
    const res = await batch(
      [
        () => f1.run(100, "success_1"),
        () => f2.run(50, "success_2"),
        () => f3.run(80, "fail_3"),
        () => f4.run(110, "fail_4"),
        () => f5.run(110, "success_5"),
      ],
      {
        size: 2,
        onBatchStart: startStub,
        onBatchEnd: endStub,
        stopOnReject: true,
      }
    );
    expect(res).toHaveLength(4);
  });
  test("should use previous values as input with waterfall", async () => {
    const res = await batch(
      [
        (arg) => f1.run(100, `${arg}_1`),
        (arg) => f2.run(50, `${arg}_2`),
        (arg) => f5.run(110, `${arg}_5`),
      ],
      {
        size: 1,
        onBatchStart: startStub,
        onBatchEnd: endStub,
        stopOnReject: true,
        waterFall: true,
        waterFallInitialValue: "hey",
      }
    );
    expect(res).toHaveLength(3);
    const expected = [
      {
        status: "fulfilled",
        value: "hey_1",
      },
      {
        status: "fulfilled",
        value: "hey_1_2",
      },
      {
        status: "fulfilled",
        value: "hey_1_2_5",
      },
    ];
    expect(res).toEqual(expected);
  });
});
