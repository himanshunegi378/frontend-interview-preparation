# Quiz: JavaScript Functional Programming & Utilities

## Questions

### Question 1 (Medium - Currying Function)
What does the following infinite currying call output, and how does it evaluate?
```javascript
function add(a) {
  return function(b) {
    if (b !== undefined) {
      return add(a + b);
    }
    return a;
  };
}

console.log(add(2)(3)(4)());
console.log(add(1)(2)());
```

---

### Question 2 (Hard - Memoize Cache Key Collisions)
Consider this basic memoize implementation. What is printed, and why does this cache fail?
```javascript
function memoize(fn) {
  const cache = {};
  return function(...args) {
    const key = args.join(",");
    if (key in cache) {
      return cache[key];
    }
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}

const sum = (a, b) => a + b;
const memoizedSum = memoize(sum);

console.log(memoizedSum(1, 2));
console.log(memoizedSum("1", "2"));
console.log(memoizedSum({ value: 1 }, { value: 2 }));
```

---

### Question 3 (Senior - Throttle Execution Details)
If a user clicks a throttled button (throttling interval = 100ms, trailing option = false) at 0ms, 30ms, 80ms, 120ms, and 210ms, at what exact timestamps will the actual target handler fire?

---

## Answer Key & Explanations

### Question 1: Infinite Currying with Sentinel Termination
- **Difficulty:** Medium
- **Answer:** `9` and `3`
- **Explanation:**
  - The function returns a nested function that expects parameter `b`.
  - If `b` is provided (not `undefined`), it recursively calls `add` with the accumulated sum `a + b`.
  - When invoked with empty parentheses `()`, `b` is passed as `undefined`. The function returns the accumulated sum `a`.
  - Thus, `add(2)(3)(4)()` evaluates to `2 + 3 + 4 = 9`.
- **Common Mistakes:** Omitting the final execution parenthesis, which returns the intermediate function representation rather than the number.
- **Interviewer Follow-up:** "How would you implement this same behavior without using the final empty call `()` (i.e. by overriding value evaluations)?" (Override the prototype `valueOf` or `toString` method of the returned function to return `a`, though this is generally avoided in production).
- **Senior-Level Insight:** Currying is useful for creating specialized helpers in shared middleware contexts (e.g. logging setups where you pre-bind service tags).

---

### Question 2: Array Joining & Primitive Key Collisions
- **Difficulty:** Hard
- **Answer:**
  1. `3`
  2. `3`
  3. `3` (or string output depending on parsing)
- **Explanation:**
  - The cache key is generated via `args.join(",")`.
  - For `memoizedSum(1, 2)`, the key is `"1,2"`. The result `3` is computed and cached.
  - For `memoizedSum("1", "2")`, the key also joins to `"1,2"`. The cache matches, and the previously computed result `3` is returned immediately. This is a collision bug, as the correct result is `"12"`.
  - For `memoizedSum({ value: 1 }, { value: 2 })`, objects are converted to strings: `[object Object],[object Object]`. The key is `"[object Object],[object Object]"`. The result is computed.
  - Any subsequent calls with different objects (e.g. `{ value: 99 }`) will join to the same key, returning the cached result.
- **Common Mistakes:** Assuming standard array joins or string conversions distinguish between data types or object shapes.
- **Interviewer Follow-up:** "How would you design a key generator that handles objects and primitives safely?" (Use `Map` or `WeakMap` objects for caches, or serialize keys using type indicators like `typeof value + ":" + value`).
- **Senior-Level Insight:** Simple caching patterns can easily cause bugs in production. In enterprise applications, use structured caching libraries (like Lodash's memoize with a custom resolver) or restrict cache keys to primitives.

---

### Question 3: Throttling Execution Intervals
- **Difficulty:** Senior
- **Answer:** The handler fires at `0ms` and `120ms` (and potentially `210ms`).
- **Explanation:**
  - At **0ms**: The button is clicked. Since no active timer is running and it's the start of the interval, the handler fires immediately. The throttle window is active from 0ms to 100ms.
  - At **30ms** and **80ms**: Clicks occur during the active throttle window (0ms to 100ms). Since `trailing` option is `false`, these clicks are ignored.
  - At **100ms**: The first throttle window expires.
  - At **120ms**: A click occurs. Since no active window is open, it fires the handler immediately. A new throttle window starts (active from 120ms to 220ms).
  - At **210ms**: A click occurs during the active window (120ms to 220ms). It is ignored.
  - If another click occurs after **220ms**, it will fire.
- **Common Mistakes:** Assuming a click at 80ms fires at 100ms (that is the trailing option behavior).
- **Interviewer Follow-up:** "How would the firing schedule change if trailing option was set to `true`?" (The click at 80ms would fire at 100ms, and the click at 210ms would fire at 220ms).
- **Senior-Level Insight:** Throttling with leading and trailing options is useful for optimizing scroll inputs, ensuring the final position is captured even if the user stops scrolling.

---

### Question 4 (Currying & Higher-Order Functions)
Explain how currying uses closures to delay execution.
**Answer:** Currying converts a function with multiple arguments into a chain of functions that each take a single argument, returning nested closures until all arguments are collected.
