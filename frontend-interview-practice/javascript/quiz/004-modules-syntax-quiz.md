# Quiz: JavaScript Modules & ES6+ Syntax

## Questions

### Question 1 (Medium - ESM Live Bindings)
Given the module code below, what is printed in `app.js` when execution completes?
```javascript
// counter.js
export let count = 0;
export function increment() {
  count++;
}

// app.js
import { count, increment } from "./counter.js";
console.log(count);
increment();
console.log(count);
```

---

### Question 2 (Hard - Destructuring Defaults)
What are the values of variables `a`, `b`, and `c` after this destructuring block runs?
```javascript
const response = {
  data: {
    status: null,
    items: undefined
  }
};

const {
  data: {
    status = "Active",
    items = ["DefaultItem"],
    limit = 10
  }
} = response;

console.log(status);
console.log(items);
console.log(limit);
```

---

### Question 3 (Senior - CJS / ESM Evaluation Timing)
What is the order of console logs printed when executing this hybrid setup under Node.js?
```javascript
// moduleA.js (CommonJS)
console.log("CJS A init");
exports.value = "A";

// moduleB.mjs (ESM)
console.log("ESM B start");
import { value } from "./moduleA.js";
console.log("ESM B end:", value);
```
*Note:* Assume Node.js runs `moduleB.mjs` as the entry file.

---

## Answer Key & Explanations

### Question 1: Read-Only Live Bindings in ESM
- **Difficulty:** Medium
- **Answer:**
  - `0`
  - `1`
- **Explanation:**
  - In ES Modules, imported bindings are **read-only live views** of the exported variables.
  - When `increment()` is called, the value of `count` inside `counter.js` increases.
  - Because `app.js` has a live link to that variable, it instantly sees the updated value `1`.
  - Note: `app.js` cannot reassign `count` directly (`count = 5` throws a compilation error).
- **Common Mistakes:** Thinking that imports behave like destructured properties or CommonJS copies (which do not update automatically on primitive values).
- **Interviewer Follow-up:** "How would the output change if this were written in CommonJS?" (In CommonJS, `require` returns a static copy of the exported values at the moment of execution. `count` would remain `0` in the importing file even after calling `increment()`, unless exported as an object property).
- **Senior-Level Insight:** Understanding live bindings is crucial when managing global state or configuration files inside monorepos.

---

### Question 2: Destructuring Evaluation Rules
- **Difficulty:** Hard
- **Answer:**
  - `null`
  - `["DefaultItem"]`
  - `10`
- **Explanation:**
  - In ES6 destructuring, default fallback values are evaluated and assigned **only** if the property value is strictly `undefined`.
  - `status` is explicitly set to `null` in the source object. Since `null !== undefined`, the default value `"Active"` is ignored, and `status` is assigned `null`.
  - `items` is set to `undefined`. The default value `["DefaultItem"]` is evaluated and assigned.
  - `limit` does not exist on `data` (resolves to `undefined`), so it defaults to `10`.
- **Common Mistakes:** Expecting `status` to default to `"Active"` because `null` is a falsy value.
- **Interviewer Follow-up:** "How would you assign a default value to `status` if it resolves to `null` during destructuring?" (You cannot do this inline during destructuring. You must apply a secondary check afterwards, e.g. `const finalStatus = status ?? "Active";`).
- **Senior-Level Insight:** In API integrations, ensure that missing inputs default using Zod schemas or explicit checks, as destructuring defaults will not catch returned `null` database values.

---

### Question 3: Hybrid Module Load Cycles
- **Difficulty:** Senior
- **Answer:**
  1. `CJS A init`
  2. `ESM B start`
  3. `ESM B end: A`
- **Explanation:**
  - ESM imports are **statically resolved** during the parsing phase, before the code inside the ESM file (like `console.log("ESM B start")`) executes.
  - To resolve the import `import { value } from "./moduleA.js"`, Node.js must load and execute `moduleA.js` (CommonJS) first to extract its exports.
  - The code inside `moduleA.js` executes, printing `CJS A init` and exporting `"A"`.
  - Once the import is resolved, execution returns to `moduleB.mjs`.
  - The ESM file executes, printing `ESM B start` followed by `ESM B end: A`.
- **Common Mistakes:** Expecting `ESM B start` to print first because it is at the top of the entry file.
- **Interviewer Follow-up:** "What happens if CJS and ESM modules contain a circular dependency?" (ESM handles circular dependencies via uninitialized live bindings, but mixing CJS and ESM circular loops often results in `undefined` imports or runtime errors due to CommonJS's synchronous execution).
- **Senior-Level Insight:** Static analysis in ESM means all imports are resolved and executed *before* the importing script runs. Keep dependencies free of circular cycles to avoid uninitialized variable bugs.

---

### Question 4 (Modules & Destructuring Syntax)
Explain the runtime loading differences between ESM and CommonJS modules.
**Answer:** CommonJS imports are evaluated dynamically at runtime, while ESM imports are linked statically during the compilation phase, allowing for tree-shaking optimizations.
