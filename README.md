# promising-utils

A utility library for promise, supports both commonjs and ESM

```bash
npm install promising-utils --save
yarn add promising-utils
```

### wait

Used when try to wait/sleep/delay for some time
options

```ts
- duration: number
// miliseconds
```

### timeout

```ts
- duration?: number
// milliseconds
- timeoutMsg?: string
// custom error message returns from reject
```

if `duration` is not defined, then it will never time out

### retry

Used to retry a promise if rejected

```ts
- retries?: number
// Number of retry times

- timeout?: number
 // define timeout for each promsie

- retryIf?: (err: any, retriedTimes: number) => boolean;
// only retry when this return true

- retryUntil?: (err: any, count: number) => boolean;
// stop retry when this return true

-  delay?: number | ((count: number) => number);
// A number or function that returns how long it should wait before next retry. `count` is the number of times it's been retried

```

if 2 or more of `retries`, `retryIf` and `retryUntil` are defined at same time, retry will stop when first condition is met.

### series

Used when to run a promise one at a one in sequence.

```ts
delay?: number | ((count: number) => number);
// delay between each promise execution
onEachStart?: (index: number) => void;
// called when each promise is executed
onEachEnd?: (index: number) => void;
// calle when each promise is resolved
stopOnReject?: boolean;
// If a promise is rejected, then stop the flow
waterFall?: boolean;
// If waterFall is true, then the current promise will receive resolved result from last promise as input
```

`series` is basically `batch` with size is 1

### batch

Similar to `series`, but can run a batch of promises at one time, 2nd batch won't start until all promises in first batches finish

```ts
size?: number;
delay?: number | ((count: number) => number);
onBatchStart?: (index: number) => void;
onBatchEnd?: (index: number) => void;
stopOnReject?: boolean;
waterFall?: boolean;
waterFallInitialValue?: any;
```

### parallel

Used when want to have fixed number of concurrent promises run at any time.

```ts
concurrency?: number;
// Number of concurrent promises running
timeout?: number;
// timeout for each promise
retries?: number;
// default is 0
stopOnReject?: boolean;
```

The difference between `parallel` and `batch`:

Assume we have 30 promises to run

if use `parallel` with concurrency to be 10. Then first 10 promises start to run, if 1 promise finished, the 11th promise will fill in to maintain total concurrency number as 10. and so on so forth.

if use `batch`, the first 10 promises start to run, if 1 promise finish, nothing happens, it continue to wait for rest 9 promises to finish, only after all 10 promises finish, the next batch of 10 will start to run.
