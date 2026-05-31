# Quiz: JavaScript Closures & Execution Contexts

## Questions

### Question 1 (Medium - Output)
What does this code output, and why?
```javascript
const result = [];
for (let i = 0; i < 3; i++) {
  result.push(function() {
    return i;
  });
}
console.log(result[0]());
console.log(result[1]());
```

---

### Question 2 (Hard - V8 Mechanics & Memory)
Consider the following memory-leak pattern. Which variable(s) are retained in memory when `replaceThing` is called repeatedly, and why?
```javascript
let theThing = null;
const replaceThing = function () {
  const originalThing = theThing;
  const unused = function () {
    if (originalThing) console.log("hi");
  };
  theThing = {
    longStr: new Array(1000000).join("*"),
    someMethod: function () {
      console.log("someMethod");
    }
  };
};
setInterval(replaceThing, 1000);
```

---

### Question 3 (Senior - Scope & Optimization)
Will the following code cause an error? If not, what is printed, and how does V8 handle hoisting in this edge case?
```javascript
var x = 1;
function test() {
  if (false) {
    var x = 2;
  }
  console.log(x);
}
test();
```

---

## Answer Key & Explanations

### Question 1: Block-scoped Loop Iterators
- **Difficulty:** Medium
- **Answer:** `0` and `1`
- **Explanation:** Because `let` is block-scoped, V8 creates a *new lexical scope binding* for `i` in each iteration of the loop. Each closure pushed to `result` binds to a different instance of `i`.
- **Common Mistakes:** Confusing `let` with `var` and assuming it outputs `3` and `3`.
- **Interviewer Follow-up:** "How does the transpiled ES5 code represent this behavior when compiling from ES6?" (Usually compiles to a nested helper function passing `i` as an argument to capture scope).
- **Senior-Level Insight:** Under the hood, block scoping in loops carries a slight performance and allocation penalty compared to flat loops, as V8 allocates a new scope block context per cycle.

---

### Question 2: Shared Lexical Context Leak (Meteor Leak)
- **Difficulty:** Hard
- **Answer:** The entire chain of old `{ longStr, someMethod }` objects remains retained in memory, causing an out-of-memory crash.
- **Explanation:** In V8, closures defined within the same lexical context parent (in this case, `replaceThing`) share the **same Context environment object**. Even though `unused` is never called, it references `originalThing`. Because `unused` shares the scope context object with `someMethod` (which *is* assigned to the global `theThing`), `originalThing` is kept alive on the heap. In the next interval run, `originalThing` points to the *previous* `theThing`, creating a linked-list chain of memory retention.
- **Common Mistakes:** Thinking `unused` will be garbage-collected since it's never called. V8 compiles scopes statically, so context sharing is determined by structural nesting, not execution paths.
- **Interviewer Follow-up:** "How would you break this memory leak chain?" (Add `originalThing = null;` at the end of the `replaceThing` function).
- **Senior-Level Insight:** This is a classic case where static optimization defaults in engine parsers require developer mitigation to prevent heap growth.

---

### Question 3: Var Hoisting inside Conditional Blocks
- **Difficulty:** Senior
- **Answer:** It prints `undefined`.
- **Explanation:** `var` is function-scoped. The declaration `var x = 2;` inside the conditional block is hoisted to the top of the function `test`. The initialization (`x = 2`) is *not* hoisted and is never executed because of `if (false)`. Therefore, local variable `x` overrides global `x` but remains `undefined` at execution time of `console.log(x)`.
- **Common Mistakes:** Thinking it prints `1` (assuming block scopes isolate `var`) or throwing a `ReferenceError`.
- **Interviewer Follow-up:** "How does change from `var` to `let` affect this output?" (If changed to `let`, `x` is block-scoped to the `if` block, so `console.log(x)` would refer to the global `x` and output `1`).
- **Senior-Level Insight:** Always enforce strict scoping rules via ESLint rules (`no-redeclare`, `no-use-before-define`) and use `const`/`let` to eliminate these runtime hoisting bugs.

---

### Question 4 (Scoping & Temporal Dead Zone)
What happens in the following code block, and why?
```javascript
let x = 1;
{
  console.log(x);
  let x = 2;
}
```
**Answer:** Throws a `ReferenceError` because of the Temporal Dead Zone (TDZ). The variable `x` is hoisted to the top of the block but remains uninitialized. Any access to it before the `let x = 2` line throws an error, shadowing the outer variable.
