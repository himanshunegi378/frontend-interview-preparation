# Quiz: JavaScript Event Loop & Asynchronous Scheduling

## Questions

### Question 1 (Medium - Output Order)
What is the order of console logs printed when this code is executed?
```javascript
console.log("Start");

setTimeout(() => {
  console.log("Timeout 1");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise 1");
});

queueMicrotask(() => {
  console.log("Microtask 1");
});

console.log("End");
```

---

### Question 2 (Hard - Async/Await Execution flow)
Determine the exact sequence of outputs for the following async/await trace:
```javascript
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
}

async function async2() {
  console.log("async2");
}

console.log("script start");

setTimeout(() => {
  console.log("setTimeout");
}, 0);

async1();

new Promise((resolve) => {
  console.log("promise1");
  resolve();
}).then(() => {
  console.log("promise2");
});

console.log("script end");
```

---

### Question 3 (Senior - Error Handling with Unhandled Rejections)
What is printed by this block of code? Identify any bugs or structural issues:
```javascript
async function fail() {
  throw new Error("Failure");
}

async function run() {
  try {
    return fail();
  } catch (err) {
    console.log("Caught:", err.message);
  }
}

run().catch((err) => {
  console.log("Unhandled:", err.message);
});
```

---

## Answer Key & Explanations

### Question 1: Microtask vs. Macrotask Priority
- **Difficulty:** Medium
- **Answer:** 
  1. `Start`
  2. `End`
  3. `Promise 1`
  4. `Microtask 1`
  5. `Timeout 1`
- **Explanation:** 
  - Synchronous logs run first (`Start`, then `End`).
  - Once the call stack is empty, V8 checks the microtask queue.
  - Both `Promise 1` and `Microtask 1` are on the microtask queue and run in FIFO order.
  - Finally, the event loop moves to the next macrotask (`Timeout 1`).
- **Common Mistakes:** Placing `Timeout 1` before microtasks because it has a delay of `0` ms.
- **Interviewer Follow-up:** "How does wrapping `Promise 1` inside a `setTimeout` affect the output?" (It moves the execution of the promise callback to a later loop iteration after that timeout macrotask runs).
- **Senior-Level Insight:** Microtask queues are fully flushed in a single iteration of the event loop. If they run indefinitely, the page crashes.

---

### Question 2: Async/Await Compiling & Suspension Flow
- **Difficulty:** Hard
- **Answer:**
  1. `script start`
  2. `async1 start`
  3. `async2`
  4. `promise1`
  5. `script end`
  6. `async1 end`
  7. `promise2`
  8. `setTimeout`
- **Explanation:**
  - Synchronous execution starts: prints `script start`.
  - `setTimeout` registers a macrotask.
  - `async1()` starts synchronously, prints `async1 start`.
  - `await async2()` runs `async2()` synchronously, printing `async2`.
  - The `await` keyword suspends `async1()`. The remaining code inside `async1` (the log `async1 end`) is queued as a microtask.
  - Synchronous thread continues: `new Promise` constructor runs synchronously, printing `promise1`. The `.then()` callback is queued as a microtask.
  - Prints synchronous `script end`.
  - The main stack is now empty. The microtask queue is checked.
  - The first microtask is the resumption of `async1()`, which prints `async1 end`.
  - The second microtask is the promise callback, printing `promise2`.
  - Finally, the event loop checks macrotasks and runs the timeout callback, printing `setTimeout`.
- **Common Mistakes:** Misunderstanding that `async2` executes synchronously, or ordering `promise2` before `async1 end`.
- **Interviewer Follow-up:** "What happens if we return a non-promise value from `async2()`?" (The behavior is identical; `await` wraps non-promise return values in a resolved Promise, queuing a microtask).
- **Senior-Level Insight:** Understanding this order is vital when coordinating React state changes that are triggered by multiple asynchronous steps.

---

### Question 3: Async Return Errors and Lost Promises
- **Difficulty:** Senior
- **Answer:** Prints `Unhandled: Failure` (it bypasses the `catch` block inside `run`).
- **Explanation:** 
  - In `run()`, the statement `return fail();` returns a Promise. 
  - Because `fail()` is returned *without* being awaited, the function `run()` completes execution and returns a pending Promise.
  - The `try/catch` block inside `run()` only catches errors thrown *during* the execution of its synchronous block. Since `fail()` runs asynchronously and returns a promise, no error is thrown *in* the stack of `run()`, so the catch block is bypassed.
  - The returned Promise eventually rejects. The outer `run().catch(...)` catches this unhandled rejection and prints `Unhandled: Failure`.
- **Fix:** Change `return fail();` to `return await fail();` if you want the local `catch` block to handle the error.
- **Common Mistakes:** Assuming `return` behaves the same as `return await` inside try/catch blocks.
- **Interviewer Follow-up:** "Why is it an anti-pattern to use `return await` outside of try/catch blocks?" (Outside of try/catch, `return await` is redundant because returning a Promise directly yields the same final resolve/reject behavior but avoids an extra microtask tick).
- **Senior-Level Insight:** Always yield to your linting rules to prevent unawaited async returns inside try/catch statements.

---

### Question 4 (Generators & Async/Await)
Write a generator function that yields promises and explain how `async/await` compiles to generator yields.
**Answer:** `async/await` is syntactic sugar over generators and promises. An `async` function returns a promise, and `await` acts like a `yield` that waits for the promise to resolve before resuming the generator loop.
