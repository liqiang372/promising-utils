import { retry } from "../src/retry";
import { RejectedPromise, ResolvedPromise } from "./testUtils";

describe("retry", () => {
  test("should not retry if promise can resolve", async () => {
    const fn = new ResolvedPromise();
    try {
      await retry(() => fn.run(100, "success"), {
        retries: 3,
      });
    } catch (err) {}
    expect(fn.calledTimes).toBe(1);
  });

  test("should retry correct number of times", async () => {
    const fn = new RejectedPromise();
    try {
      await retry(() => fn.run(100, "404"), { retries: 3 });
    } catch (err) {
      expect(err.message).toBe("404");
    }
    expect(fn.calledTimes).toBe(4);
  });

  test("should retry until succeed if retries not defined", async () => {
    const resolvedFn = new ResolvedPromise();
    const rejectedFn = new RejectedPromise();
    let count = 0;

    try {
      await retry(() => {
        count++;
        if (count === 10) {
          return resolvedFn.run(100, "success");
        }
        return rejectedFn.run(100, "failed");
      });
    } catch (err) {}
    expect(resolvedFn.calledTimes).toBe(1);
    expect(rejectedFn.calledTimes).toBe(9);
  });

  test("should fail promise with timeout", async () => {
    const fn = new RejectedPromise();
    try {
      await retry(() => fn.run(100, "404"), {
        retries: 2,
        timeout: 50,
      });
    } catch (err) {
      expect(err.message).toBe("timed out after 50 milliseconds");
    }
    expect(fn.calledTimes).toBe(3);
  });

  test("should keep retrying when retryIf is true", async () => {
    const rejectedFn = new RejectedPromise();

    let count = 0;
    try {
      await retry(
        () => {
          count++;
          return rejectedFn.run(100, "failed");
        },
        {
          retryIf: (err) => {
            expect(err.message).toBe("failed");
            return count < 5;
          },
        }
      );
    } catch (err) {
      expect(err.message).toBe("failed");
    }
    expect(rejectedFn.calledTimes).toBe(5);
  });

  test("should retry the minimum count of retries and retryIf part 1", async () => {
    const rejectedFn = new RejectedPromise();
    let count = 0;
    try {
      await retry(
        () => {
          count++;
          return rejectedFn.run(100, "failed");
        },
        {
          retries: 2,
          retryIf: (err) => {
            expect(err.message).toBe("failed");
            return count < 5;
          },
        }
      );
    } catch (err) {
      expect(err.message).toBe("failed");
    }
    expect(rejectedFn.calledTimes).toBe(3);
  });

  test("should retry the minimum count of retries and retryIf part 2", async () => {
    const rejectedFn = new RejectedPromise();
    let count = 0;
    try {
      await retry(
        () => {
          count++;
          return rejectedFn.run(100, "failed");
        },
        {
          retries: 10,
          retryIf: (err) => {
            expect(err.message).toBe("failed");
            return count < 5;
          },
        }
      );
    } catch (err) {
      expect(err.message).toBe("failed");
    }
    expect(rejectedFn.calledTimes).toBe(5);
  });

  test("should keep retrying until retryUntil is true", async () => {
    const rejectedFn = new RejectedPromise();

    let count = 0;
    try {
      await retry(
        () => {
          count++;
          return rejectedFn.run(100, "failed");
        },
        {
          retryUntil: (err) => {
            expect(err.message).toBe("failed");
            return count === 5;
          },
        }
      );
    } catch (err) {
      expect(err.message).toBe("failed");
    }
    expect(rejectedFn.calledTimes).toBe(5);
  });

  test("should retry the minimum count of retries, retryIf, retryUntil", async () => {
    const rejectedFn = new RejectedPromise();
    let count = 0;
    try {
      await retry(
        () => {
          count++;
          return rejectedFn.run(100, "failed");
        },
        {
          retries: 4,
          retryIf: (err) => {
            expect(err.message).toBe("failed");
            return count < 5;
          },
          retryUntil: (err) => {
            expect(err.message).toBe("failed");
            return count === 2;
          },
        }
      );
    } catch (err) {
      expect(err.message).toBe("failed");
    }
    expect(rejectedFn.calledTimes).toBe(2);
  });
});
