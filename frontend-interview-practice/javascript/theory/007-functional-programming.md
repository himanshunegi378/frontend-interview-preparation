# JavaScript Functional Programming: Closures, Debounce, Throttle, Currying, & Memoization

## Why It Matters
Senior engineers use functional programming patterns to create modular, side-effect-free, and performance-optimized systems. Understanding execution delays (debounce/throttle), computation caching (memoization), and parameter currying is key to optimizing client interactions, preventing server overload, and managing complex configurations.

---

## Core Concepts & Mental Models

### 1. Higher-Order Functions (HOFs)
A higher-order function is any function that either accepts another function as an argument, returns a function, or both. Examples include native Array methods (`map`, `filter`, `reduce`) and utility factories (`debounce`, `memoize`).

### 2. Debouncing vs. Throttling (Rate Limiting)
- **Debounce**: Delays function execution until a specified quiet period (no invocations) has passed. If another call occurs during this window, the timer resets. (e.g. search autocomplete typing).
- **Throttle**: Restricts function execution to at most once per specified time interval. Subsequent calls within the window are ignored or postponed. (e.g. scroll handlers, resizing).

```
Timeline Comparison:
Invocations:  -x-x-x-x---------x-x-------
Debounce:     ----------------x-------x- (executes after silence gap)
Throttle:     -x-------x-------x-------x- (executes at steady intervals)
```

### 3. Currying & Partial Application
- **Currying**: A transformation process that converts a function taking multiple arguments (e.g., `f(a, b, c)`) into a chain of nested functions, each taking a single argument (e.g., `f(a)(b)(c)`).
- **Partial Application**: Fixing a subset of arguments to a function, producing a new function of smaller arity (arguments count).

### 4. Memoization (Computation Cache)
Memoization caches function execution results based on input parameters. If the function is pure, subsequent calls with identical arguments retrieve the result directly from the cache rather than recomputing it.

---

## Real-World Case Study / Examples

### 1. Heavy Search Input Sync
Using a debounce wrapper on database search queries prevents typing inputs from executing dozens of redundant fetch requests:

```javascript
const searchApiCall = async (query) => {
  return fetch(`/api/search?q=${query}`).then(res => res.json());
};

const debouncedSearch = debounce(searchApiCall, 300);

inputElement.addEventListener("input", (e) => {
  debouncedSearch(e.target.value);
});
```

---

## Common Interview Traps

### 1. Loose Memoization Keys
Many custom memoization caches use `JSON.stringify` to create cache keys from arguments:
```javascript
const key = JSON.stringify(args);
```
**Trap:** `JSON.stringify` ignores functions, symbol parameters, and undefined keys, and treats objects with different key orderings as distinct strings, resulting in cache misses or duplicate evaluations.
**Fix:** Implement a robust key-generator or restrict parameters to primitive keys.

---

## Junior vs. Senior View

- **Junior View**: "Debounce is just setTimeout, and currying is passing parameters one by one."
- **Senior View**: "Functional utilities leverage closure scopes to track state (timers, execution bounds, cache stores). Senior engineers understand how throttles schedule leading vs. trailing executions, use Map-based caches for memory-efficient memoization, and avoid recursion stack overflows by using tail-call optimization or converting recursive functions to iterative loops."

---

## Related Interview Questions
1. "Explain the differences in execution scheduling between the leading and trailing variants of debounce."
2. "How does currying help write cleaner, more reusable utility functions in large-scale applications?"
3. "Under what circumstances does memoization degrade performance and increase memory usage?"
4. "How do you implement a tail-call optimized recursion loop to prevent call stack overflow errors?"
