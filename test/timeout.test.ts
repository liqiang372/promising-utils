import { timeout } from "../src/timeout";
import { wait } from "../src/wait";

describe("timeout", () => {
  test("should resolve before timeout", async () => {
    const fn = () => wait(100).then(() => 1);
    const result = await timeout(fn, { duration: 200 });
    expect(result).toBe(1);
  });

  test("should reject after timeout", async () => {
    const fn = () => wait(300).then(() => 1);
    expect(timeout(fn, { duration: 200 })).rejects.toThrow(
      "timed out after 200 milliseconds"
    );
  });

  test("should show custom error msg", async () => {
    const CUSTOM_ERROR_MSG = "timedout!!!";
    const fn = () => wait(300).then(() => 1);
    expect(
      timeout(fn, { duration: 200, timeoutMsg: CUSTOM_ERROR_MSG })
    ).rejects.toThrow(CUSTOM_ERROR_MSG);
  });
});
