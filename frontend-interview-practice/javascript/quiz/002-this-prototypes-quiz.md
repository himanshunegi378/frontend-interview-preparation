# Quiz: JavaScript 'this' Binding & Prototypes

## Questions

### Question 1 (Medium - Output of This Bindings)
What is the output of the console logs when this code is executed?
```javascript
const profile = {
  name: "John",
  printName1: function() {
    console.log(this.name);
  },
  printName2: () => {
    console.log(this.name);
  }
};

const anotherProfile = { name: "Sarah" };

profile.printName1();
profile.printName1.call(anotherProfile);
profile.printName2();
profile.printName2.call(anotherProfile);
```

---

### Question 2 (Hard - Prototypal Inheritance Mechanics)
What does this code output, and how does the property lookup chain resolve?
```javascript
function Parent() {
  this.value = "ParentValue";
}
Parent.prototype.getValue = function() {
  return this.value;
};

function Child() {
  Parent.call(this);
  this.value = "ChildValue";
}
Child.prototype = Object.create(Parent.prototype);

const instance = new Child();
console.log(instance.getValue());

delete instance.value;
console.log(instance.getValue());
```

---

### Question 3 (Senior - Object Shadowing & Freezing)
Consider this frozen object setup. Does modifying `obj2.x` update the value, fail silently, or throw an error?
```javascript
"use strict";
const obj1 = Object.freeze({ x: 10 });
const obj2 = Object.create(obj1);

try {
  obj2.x = 20;
  console.log(obj2.x);
} catch (e) {
  console.log("Error:", e.message);
}
```

---

## Answer Key & Explanations

### Question 1: Arrow Functions vs. Function Bindings
- **Difficulty:** Medium
- **Answer:**
  1. `John`
  2. `Sarah`
  3. `undefined` (or global window name if set)
  4. `undefined` (or global window name if set)
- **Explanation:**
  - `profile.printName1()` uses implicit binding: `this` points to `profile`, yielding `John`.
  - `profile.printName1.call(anotherProfile)` uses explicit binding: `this` is redirected to `anotherProfile`, yielding `Sarah`.
  - `profile.printName2` is an arrow function. It captures `this` from its enclosing lexical environment during declaration. Since `profile` is an object declaration (which does not establish a new execution scope context, unlike functions), the outer scope is the global/module scope. Therefore, `this` inside `printName2` points to the global scope.
  - Arrow functions ignore explicit bindings like `.call()`, so `printName2.call(anotherProfile)` still resolves `this` to the global scope, yielding `undefined`.
- **Common Mistakes:** Thinking arrow functions are bound to the object definition they reside in.
- **Interviewer Follow-up:** "How would you rewrite the object to make `printName2` refer to `profile`?" (Wrap it in an outer function context that returns the object, binding the lexical scope to the outer function execution).
- **Senior-Level Insight:** In class components, binding callback functions inside render loops causes new function allocations per render. Use arrow methods on classes to bind execution contexts without extra allocations.

---

### Question 2: Prototypical Property Delegation
- **Difficulty:** Hard
- **Answer:**
  1. `ChildValue`
  2. `undefined`
- **Explanation:**
  - `instance` is created from the `Child` constructor. Calling `instance.getValue()` resolves `getValue` from `Parent.prototype` via the prototype link chain. Since the execution context (`this`) is `instance`, `this.value` resolves to the local property `value` set to `ChildValue`.
  - `delete instance.value` removes the local key `value` from the `instance` object.
  - The second call to `instance.getValue()` attempts to read `this.value` (which is `instance.value`). Because `value` is deleted locally, the lookup traverses the prototype chain: first `Child.prototype`, then `Parent.prototype`.
  - Neither `Child.prototype` nor `Parent.prototype` contains a `value` key. (The `Parent` constructor sets `this.value = "ParentValue"`, which resides on the *parent instance*, not on `Parent.prototype`).
  - Thus, the lookup reaches the end of the chain without finding the key, returning `undefined`.
- **Common Mistakes:** Expecting `ParentValue` to print after deleting `ChildValue`.
- **Interviewer Follow-up:** "How would you set a default fallback value for all instances on the prototype?" (Assign `Child.prototype.value = "Fallback"`).
- **Senior-Level Insight:** Calling constructors within other constructors via `.call(this)` copies variables locally to the instance. This prevents prototype lookups for instance properties.

---

### Question 3: Non-Writable Prototype Properties in Strict Mode
- **Difficulty:** Senior
- **Answer:** Throws an error: `Cannot assign to read only property 'x' of object '#<Object>'` (or similar depending on engine).
- **Explanation:**
  - `Object.freeze` marks all properties on `obj1` as non-writable (`writable: false`).
  - `obj2` is created with `obj1` as its prototype. When executing `obj2.x = 20`, the engine checks if `x` can be shadowed.
  - In JavaScript, if a property is defined on an object's prototype as **non-writable**, you cannot shadow it by directly assigning a value to the child object. The assignment fails.
  - In `"use strict"` mode, this failure throws a `TypeError`. In non-strict mode, it fails silently, and `obj2.x` remains `10`.
- **Fix:** To shadow the property, you must define it using descriptor calls: `Object.defineProperty(obj2, 'x', { value: 20, writable: true })`.
- **Common Mistakes:** Assuming prototype shadowing always works, regardless of property descriptors on the parent prototype.
- **Interviewer Follow-up:** "Why does the language block assignments to inherited non-writable properties?" (To preserve the immutability guarantees of parent interfaces).
- **Senior-Level Insight:** When freezing global templates, ensure that child objects do not attempt direct assignments on inherited keys, or explicitly use descriptors to configure shadows.
