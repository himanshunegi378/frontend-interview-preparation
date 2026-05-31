# Practical: Custom Promise Implementation

## Problem Title: Custom Promise Class (Promises/A+ Spec Subset)

## Difficulty: Hard / Senior

## Skills Tested
- Asynchronous Task Scheduling (Microtasks via `queueMicrotask`)
- State Machine Architecture
- Callback Registry & Propagation
- Chaining Promises & Unwrapping

## Problem Statement
Implement a custom Promise class `MyPromise` that mimics the native JS `Promise` class. Your implementation must follow the core mechanics of the Promises/A+ specification, specifically allowing asynchronous chaining and resolving nested promises.

Your `MyPromise` class should support:
1. `new MyPromise((resolve, reject) => { ... })`
2. `.then(onFulfilled, onRejected)`: Schedules microtask callbacks and returns a new `MyPromise` for chaining.
3. `.catch(onRejected)`: Rejection catch handler.
4. Static `MyPromise.resolve(value)` and `MyPromise.reject(reason)`.

## Starter Code
```javascript
const STATES = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected"
};

export class MyPromise {
  constructor(executor) {
    // Implement
  }

  then(onFulfilled, onRejected) {
    // Implement
  }

  catch(onRejected) {
    // Implement
  }

  static resolve(value) {
    // Implement
  }

  static reject(reason) {
    // Implement
  }
}
```

## Requirements
- Callback execution must be asynchronous. You must schedule callbacks using `queueMicrotask` to mimic native microtask behaviors.
- The state must only change once (from `PENDING` to either `FULFILLED` or `REJECTED`).
- If an executor throws an error, the promise must reject with that error.
- Support "Promise Unwrapping": If a promise resolves to another promise, it must wait for that inner promise to resolve/reject and adopt its final state.

## Edge Cases
- **Self-resolution**: A promise must not resolve to itself (should throw a `TypeError`).
- **Callback omissions**: If `.then` is called without callback functions, the value/rejection must propagate down the chain.
- **Immediate Resolution**: Resolving synchronously in the executor must still delay callback execution until the microtask queue runs.

## Expected Approach
Maintain internal states (`state`, `value`, `fulfilledHandlers`, `rejectedHandlers`). When `resolve` or `reject` is invoked, verify state constraints, update the state, and iterate through stored handlers. In the `.then` method, return a new `MyPromise` and register a wrapper that executes the user-defined callbacks asynchronously using `queueMicrotask`.

## Solution
```javascript
const STATES = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected"
};

export class MyPromise {
  #state = STATES.PENDING;
  #value = undefined;
  #fulfilledCallbacks = [];
  #rejectedCallbacks = [];

  constructor(executor) {
    const resolve = (value) => {
      if (this.#state !== STATES.PENDING) return;

      // Handle Promise Unwrapping
      if (value instanceof MyPromise || (value && typeof value.then === "function")) {
        value.then(resolve, reject);
        return;
      }

      this.#state = STATES.FULFILLED;
      this.#value = value;
      this.#runCallbacks();
    };

    const reject = (reason) => {
      if (this.#state !== STATES.PENDING) return;
      this.#state = STATES.REJECTED;
      this.#value = reason;
      this.#runCallbacks();
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  #runCallbacks() {
    if (this.#state === STATES.PENDING) return;

    queueMicrotask(() => {
      const callbacks = this.#state === STATES.FULFILLED ? this.#fulfilledCallbacks : this.#rejectedCallbacks;
      callbacks.forEach((cb) => cb(this.#value));
      this.#fulfilledCallbacks = [];
      this.#rejectedCallbacks = [];
    });
  }

  then(onFulfilled, onRejected) {
    // Default handlers for propagation
    const realOnFulfilled = typeof onFulfilled === "function" ? onFulfilled : (v) => v;
    const realOnRejected = typeof onRejected === "function" ? onRejected : (err) => { throw err; };

    const nextPromise = new MyPromise((resolve, reject) => {
      const handleFulfilled = (value) => {
        try {
          const result = realOnFulfilled(value);
          if (result === nextPromise) {
            throw new TypeError("Chaining cycle detected for promise");
          }
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      const handleRejected = (reason) => {
        try {
          const result = realOnRejected(reason);
          if (result === nextPromise) {
            throw new TypeError("Chaining cycle detected for promise");
          }
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      if (this.#state === STATES.PENDING) {
        this.#fulfilledCallbacks.push(handleFulfilled);
        this.#rejectedCallbacks.push(handleRejected);
      } else {
        queueMicrotask(() => {
          if (this.#state === STATES.FULFILLED) {
            handleFulfilled(this.#value);
          } else {
            handleRejected(this.#value);
          }
        });
      }
    });

    return nextPromise;
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  static resolve(value) {
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }
}
```

## Explanation
- **Microtask Timing**: The solution schedules all callback iterations via `queueMicrotask`. This guarantees that code running after `.then()` runs *before* the callbacks run, mimicking the asynchronous behavior of native ES6 Promises.
- **Chaining Cycle**: If a handler returns the same Promise instance returned by `.then()`, it would result in an infinite resolution loop. The code throws a `TypeError` to catch this.
- **Propagation**: If `.then()` is called without arguments, values and rejections pass through using default functions: `(v) => v` and `(err) => { throw err; }`.

## Time Complexity
- Construction & resolution: $O(1)$ operations.
- Handler registration (`.then`): $O(1)$.
- Chain resolution: $O(M)$ where $M$ is the depth of the promise chains.

## Space Complexity
- $O(H)$ where $H$ is the number of pending callbacks stored in memory.

## Interviewer Follow-ups
1. "How would you implement static helper `MyPromise.all(promises)`?" (Return a promise that counts settled values, resolving when the counter matches the input array length, or rejecting immediately on the first error).
2. "Why does calling `queueMicrotask` prevent browser layout shifts during resolution cycles?" (Microtasks are flushed before layout/paint, ensuring UI transitions do not trigger double updates).

## Senior-Level Discussion
In enterprise applications, native Promises are standard, but custom promise loops appear in library adapters or older platforms. Understanding promise unwrapping is crucial when building SDKs that fetch cache targets asynchronously, where a return value might be a static object or another async fetch hook.

---

### Extra Practice: Async/Await & Generators/Iterators
**Task:** Implement a generator-based co-routine library `runCo(generatorFunc)` that runs asynchronous tasks like `co`:
```javascript
export function runCo(generatorFunc) {
  const iterator = generatorFunc();
  function handle(result) {
    if (result.done) return Promise.resolve(result.value);
    return Promise.resolve(result.value).then(
      res => handle(iterator.next(res)),
      err => handle(iterator.throw(err))
    );
  }
  return handle(iterator.next());
}
```
