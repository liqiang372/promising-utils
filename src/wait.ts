/**
 * @param duration milliseconds
 */
export const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });
