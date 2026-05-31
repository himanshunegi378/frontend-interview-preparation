# Quiz: JavaScript Types, Coercion, & Equality

## Questions

### Question 1 (Medium - Addition & Coercion Order)
What do these expressions evaluate to, and what are their types?
```javascript
const exp1 = 1 + "2" + 3;
const exp2 = 1 + +"2" + 3;
const exp3 = "1" - - "2" + 3;
console.log(exp1, typeof exp1);
console.log(exp2, typeof exp2);
console.log(exp3, typeof exp3);
```

---

### Question 2 (Hard - Abstract Equality Traps)
What does this comparison block output?
```javascript
console.log(null == undefined);
console.log(null === undefined);
console.log(NaN == NaN);
console.log([] == 0);
console.log([1] == 1);
```

---

### Question 3 (Senior - SameValue Zero vs SameValue)
Given the following Map keys, does the map treat them as identical or separate? Explain how Map key matching handles `-0`, `+0`, and `NaN`.
```javascript
const myMap = new Map();
myMap.set(-0, "negative");
myMap.set(+0, "positive");

myMap.set(NaN, "not-a-number");
myMap.set(NaN, "override");

console.log(myMap.get(0));
console.log(myMap.get(NaN));
```

---

## Answer Key & Explanations

### Question 1: Arithmetic Type Conversions
- **Difficulty:** Medium
- **Answer:**
  - `123`, type `string`
  - `6`, type `number`
  - `6`, type `number`
- **Explanation:**
  - `exp1`: Evaluated left-to-right. `1 + "2"` undergoes string concatenation resulting in `"12"`. `"12" + 3` results in the string `"123"`.
  - `exp2`: The unary `+` operator has higher precedence. `+"2"` converts the string `"2"` to number `2`. Then `1 + 2` is `3`. Finally `3 + 3` is `6`.
  - `exp3`: The expression `"1" - - "2"` contains two negations. The binary `-` forces coercion to numbers: `"1" - (-2)` which resolves to `1 + 2 = 3`. Then `3 + 3` is `6`.
- **Common Mistakes:** Misunderstanding unary operators or ignoring left-to-right evaluation orders.
- **Interviewer Follow-up:** "How would the engine handle `{} + []` in a console?" (Depends on engine environment: at start of line, `{}` is interpreted as an empty block, evaluating to `+[] -> 0`. If wrapped in parentheses `({} + [])`, it evaluates to `"[object Object]"`).
- **Senior-Level Insight:** Avoid implicit string and number mixtures in calculations. Use explicit methods like `Number(val)` or `String(val)` to make your intentions clear.

---

### Question 2: Strict vs. Abstract Equality Spec Rules
- **Difficulty:** Hard
- **Answer:**
  1. `true`
  2. `false`
  3. `false`
  4. `true`
  5. `true`
- **Explanation:**
  - `null == undefined` is hardcoded as `true` in the abstract equality specification (step 2/3).
  - `null === undefined` is `false` because they have different types.
  - `NaN == NaN` is always `false` by specification definition. To test for `NaN`, use `Number.isNaN()` or `Object.is()`.
  - `[] == 0`: `[]` is coerced to a primitive. Arrays join their elements; an empty array becomes `""`. Then `"" == 0` is coerced to number comparison: `0 == 0`, returning `true`.
  - `[1] == 1`: `[1]` is coerced to `"1"`. Then `"1" == 1` is coerced to number comparison: `1 == 1`, returning `true`.
- **Common Mistakes:** Thinking `NaN` is equal to itself, or assuming objects compared to primitives return false immediately.
- **Interviewer Follow-up:** "Why does `[] == ![]` return `true`?" (Because `![]` coerces to boolean `false`, and `[]` is coerced to `""`, resulting in comparing `"" == false`, which translates to number comparison `0 == 0`).
- **Senior-Level Insight:** The unexpected behavior of abstract equality is why strict equality `===` is mandatory in modern JavaScript style guides.

---

### Question 3: SameValueZero Key Matching in Map & Set
- **Difficulty:** Senior
- **Answer:**
  - `positive`
  - `override`
- **Explanation:**
  - ES6 `Map` and `Set` use the **SameValueZero** algorithm to determine key equality.
  - Under SameValueZero, `-0` and `+0` are treated as **equal**. Therefore, `myMap.set(+0, "positive")` overrides the value stored at key `-0`. Retrieving `myMap.get(0)` returns the updated value `"positive"`.
  - Under SameValueZero, `NaN` is also treated as **equal to itself**. Therefore, `myMap.set(NaN, "override")` overrides the previous entry, and `myMap.get(NaN)` returns `"override"`.
  - Note: This is different from the SameValue algorithm (`Object.is`), which treats `-0` and `+0` as distinct.
- **Common Mistakes:** Assuming `NaN` keys cannot be retrieved because `NaN !== NaN` in standard comparisons.
- **Interviewer Follow-up:** "How does `Array.prototype.indexOf` handle `NaN` search targets compared to `Array.prototype.includes`?" (`indexOf` uses strict comparison `===` and will return `-1` when searching for `NaN`. `includes` uses SameValueZero and will locate the `NaN` element correctly).
- **Senior-Level Insight:** Understanding these internal algorithms is crucial when designing high-performance lookup caches that use floating-point numbers or unique sentinel values as map keys.

---

### Question 4 (Immutability & Equality)
Why does `Object.freeze({ a: 1 })` not perform a deep freeze, and how does `Object.is()` compare to `===`?
**Answer:** `Object.freeze()` is shallow. Nested objects can still be mutated. `Object.is()` behaves like `===` but returns `true` for `Object.is(NaN, NaN)` and `false` for `Object.is(+0, -0)`.
