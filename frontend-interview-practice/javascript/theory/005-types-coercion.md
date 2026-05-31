# JavaScript Types, Coercion, Equality, & Copying

## Why It Matters
Senior engineers must master JavaScript's type system and coercion mechanics to prevent silent bugs, write predictable data models, and optimize performance. Inconsistent type checks can lead to application crashes, security vulnerabilities (e.g. bypass validation), and performance degradation in V8 due to polymorphic shapes.

---

## Core Concepts & Mental Models

### 1. Primitives vs. Objects
JavaScript has 7 primitive types (`string`, `number`, `boolean`, `undefined`, `null`, `symbol`, `bigint`) and reference types (`object`, including arrays and functions).
- **Primitives**: Stored on the stack or inline in the execution memory. They are immutable.
- **Reference Types**: Stored on the heap. Variables hold a reference address pointing to the heap memory slot.

### 2. Primitive Boxing (V8 wrapper objects)
When accessing properties on primitives (e.g., `"hello".toUpperCase()`), V8 temporarily wraps (boxes) the primitive in its corresponding object constructor (e.g., `new String("hello")`), executes the method, and immediately discards the wrapper object to prevent memory bloat.

### 3. Implicit Type Coercion Rules
Coercion happens in three directions:
- **ToBoolean**: Handled via simple truthy/falsy evaluation.
- **ToNumber**: Evaluated when performing arithmetic operations (except `+` with strings). Primitives are converted: `true -> 1`, `false -> 0`, `null -> 0`, `undefined -> NaN`, strings parsed numerically.
- **ToString**: Triggered during string concatenations (`+`). For objects, the engine invokes `[Symbol.toPrimitive]("string")`, falling back to `.toString()` or `.valueOf()`.

### 4. Equality Comparison Algorithms
JavaScript uses four equality algorithms:
- **Abstract Equality (`==`)**: Performs implicit coercion before comparison.
- **Strict Equality (`===`)**: Compares values and types without coercion.
- **SameValue (`Object.is(a, b)`)**: Behaves like `===` but distinguishes between `-0` and `+0` (`Object.is(-0, +0) === false`), and treats `NaN` as equal to `NaN` (`Object.is(NaN, NaN) === true`).
- **SameValueZero**: Used internally by arrays and maps (`includes`, `has`). Treats `NaN === NaN` but `-0 === +0`.

```
Equality Matrix:
┌─────────────────┬──────────┬──────────┬─────────────┐
│ Comparison      │ ==       │ ===      │ Object.is() │
├─────────────────┼──────────┼──────────┼─────────────┤
│ NaN === NaN     │ false    │ false    │ true        │
│ -0 === +0       │ true     │ true     │ false       │
│ null === undef  │ true     │ false    │ false       │
└─────────────────┴──────────┴──────────┴─────────────┘
```

### 5. Cloning: Shallow vs. Deep Copy
- **Shallow Copy**: Copies the top-level properties. Inner objects share references (e.g., `Object.assign()`, `{...obj}`, `Array.prototype.slice()`).
- **Deep Copy**: Copies all levels recursively, creating completely independent heap records (e.g., `structuredClone()`, recursive custom deep copy, `JSON.parse(JSON.stringify(obj))` - though JSON has limitations like ignoring functions/symbols/undefined).

---

## Real-World Case Study / Examples

### 1. Secure Validation Bypass
Implicit coercion can lead to security bypasses in route checkers if variables are not compared strictly:

```javascript
// Server validation check
function authenticate(userId, secretToken) {
  // If token is null, and secretToken is undefined:
  if (userId == null) {
     return false;
  }
  // Bad comparison allows empty authentication
}
```
**Fix:** Always use strict equality (`===`) and run type schemas via tools like Zod to enforce structure constraints.

---

## Common Interview Traps

### 1. Double Equal Coercion Cycles
```javascript
[] == ![] 
// Evaluates to: true!
// 1. ![] converts to false (ToBoolean on object is true, negated is false).
// 2. [] == false
// 3. [] converts to primitive (ToString): ""
// 4. "" == false
// 5. Both convert to numbers: 0 == 0 -> true.
```

---

## Junior vs. Senior View

- **Junior View**: "`==` compares values and `===` compares values and types. Deep copy can always be done with JSON.stringify."
- **Senior View**: "Equality in JS is driven by four spec-level algorithms (Abstract, Strict, SameValue, SameValueZero). Deep copying using JSON serialization is an anti-pattern because it silently discards functions, RegExp, Date, Map/Set, and circular references. Senior engineers utilize `structuredClone` or custom recursive cloning helpers to safeguard heap configurations."

---

## Related Interview Questions
1. "How does the `Object.is` algorithm differ from the strict equality operator (`===`)?"
2. "Under the hood, how does V8 evaluate the expression `[] + {}` vs `{}` + `[]` in browser consoles?"
3. "What are the limitations of the native `structuredClone()` function introduced in modern browsers?"
4. "How does JavaScript resolve the expression `1 + 2 + "3"`?"

---

## Immutability & Deep Copying Mechanics
Immutability means that once data is created, it cannot be changed. In JavaScript, primitives are immutable by default, but objects and arrays are mutable.
To preserve state consistency in frameworks like React, we must copy objects.
- **Shallow Copy**: Copies the first level of keys (using `{ ...obj }` or `Object.assign()`). Nested references are shared.
- **Deep Copy**: Recursively copies all levels of nested objects/arrays. Can be done via `JSON.parse(JSON.stringify(obj))` (fails with dates, maps, sets, functions) or browser-native `structuredClone()`.
