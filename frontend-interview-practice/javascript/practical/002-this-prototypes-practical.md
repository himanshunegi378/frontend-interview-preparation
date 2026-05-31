# Practical: Polyfilling Call, Apply, & Bind

## Problem Title: Context Bindings (Custom Call, Apply, and Bind Polyfills)

## Difficulty: Hard / Senior

## Skills Tested
- Implicit Context Binding Rules
- Argument list parsing & processing
- Prototype delegation chain linking
- Constructor instantiation mechanics (`new` target checking)

## Problem Statement
Implement custom polyfills for `Function.prototype.myCall`, `Function.prototype.myApply`, and `Function.prototype.myBind`. You are **forbidden** from using native `.call()`, `.apply()`, or `.bind()` within your implementations.

Your polyfills must:
1. `myCall(context, ...args)`: Bind the function to the context and execute it with individual arguments.
2. `myApply(context, argsArray)`: Bind the function to the context and execute it with arguments passed as an array.
3. `myBind(context, ...args)`: Return a bound function that can accept additional arguments upon execution. The bound function must support constructor instantiation with the `new` operator.

## Starter Code
```javascript
export function registerPolyfills() {
  if (!Function.prototype.myCall) {
    Function.prototype.myCall = function(context, ...args) {
      // Implement
    };
  }

  if (!Function.prototype.myApply) {
    Function.prototype.myApply = function(context, argsArray) {
      // Implement
    };
  }

  if (!Function.prototype.myBind) {
    Function.prototype.myBind = function(context, ...args) {
      // Implement
    };
  }
}
```

## Requirements
- Do not use native `call`, `apply`, or `bind` helpers.
- Handle edge-case contexts: If `context` is `null` or `undefined`, default to `globalThis` (or `window` in browser). If it's a primitive (string, number, boolean), box it into its object wrapper.
- Ensure that `myBind` bound functions can be instantiated using `new`. In that case, the newly created object must adopt the original function's prototype, and `this` inside the function must point to the new instance.

## Edge Cases
- **Unique keys**: Avoid overwriting existing properties on the context object during implicit invocation. Use `Symbol` to guarantee unique property names.
- **Strict Mode**: In strict mode, primitive contexts should not be boxed, but for simplicity in this exercise, focus on standard browser environment defaults.

## Expected Approach
To implicitly bind `this` to a target object, assign the function as a temporary property of the context object (using a `Symbol`). Invoke it using the object property access path (e.g., `context[tempKey](...args)`), which automatically binds `this` to `context`. Then, remove the temporary property.

For `myBind`, return a wrapper function. If that wrapper is called as a constructor (detected by checking `this instanceof boundFunction` or using `new.target`), route the context to the newly created instance instead.

## Solution
```javascript
export function registerPolyfills() {
  // Helper to box primitive contexts
  function getContext(context) {
    if (context === null || context === undefined) {
      return globalThis;
    }
    return Object(context);
  }

  if (!Function.prototype.myCall) {
    Function.prototype.myCall = function(context, ...args) {
      const targetContext = getContext(context);
      const fnKey = Symbol("tempFn");

      // Store function implicitly on target context
      targetContext[fnKey] = this;

      // Execute and capture result
      const result = targetContext[fnKey](...args);

      // Clean up reference
      delete targetContext[fnKey];

      return result;
    };
  }

  if (!Function.prototype.myApply) {
    Function.prototype.myApply = function(context, argsArray) {
      const targetContext = getContext(context);
      const fnKey = Symbol("tempFn");

      targetContext[fnKey] = this;

      // Handle null/undefined argument array
      const safeArgs = Array.isArray(argsArray) ? argsArray : [];
      const result = targetContext[fnKey](...safeArgs);

      delete targetContext[fnKey];

      return result;
    };
  }

  if (!Function.prototype.myBind) {
    Function.prototype.myBind = function(context, ...boundArgs) {
      const originalFn = this;

      function boundTarget(...args) {
        // Detect if invoked with 'new'
        const isConstructor = this instanceof boundTarget;
        
        // If constructor, use 'this' instance context. Otherwise, use bound context
        const executionContext = isConstructor ? this : context;
        
        return originalFn.myCall(executionContext, ...boundArgs, ...args);
      }

      // Link prototype to preserve chain structures on construction
      if (originalFn.prototype) {
        boundTarget.prototype = Object.create(originalFn.prototype);
      }

      return boundTarget;
    };
  }
}
```

## Explanation
- **Boxed Context**: We use `Object(context)` to convert primitives like strings or numbers into their equivalent object forms, so they can hold temporary properties.
- **Symbol Key**: Using `Symbol` ensures that the temporary function property does not overwrite any existing properties on the context.
- **Constructor Support in Bind**: In `myBind`, we check `this instanceof boundTarget`. When invoked as `new boundTarget()`, `this` is a new object linked to `boundTarget.prototype`. This check redirects the context from the original bound target back to the new instance.

## Time Complexity
- `myCall`: $O(1)$ property assignments.
- `myApply`: $O(1)$.
- `myBind`: $O(1)$ to create the closure.

## Space Complexity
- $O(1)$ auxiliary space.

## Interviewer Follow-ups
1. "How does using `Symbol` protect the context object from mutation leak patterns?" (It guarantees a unique key, preventing key collisions on the target object).
2. "Why is `Object.create(originalFn.prototype)` used in `myBind` instead of `boundTarget.prototype = originalFn.prototype`?" (Direct assignment would cause any modifications to the prototype of the bound function to also modify the original function's prototype, breaking inheritance isolation).

## Senior-Level Discussion
Understanding these core mechanics is helpful when debugging older libraries that polyfill context behaviors. In modern engines, overriding native prototypes is generally avoided due to performance degradation in V8 optimization pipelines. However, writing these polyfills demonstrates a deep understanding of JavaScript's execution context model and runtime behaviors.

---

### Extra Practice: Prototypes, Classes, & Inheritance
**Task:** Implement a class-based inheritance model without using ES6 `class`, instead using prototype chains:
```javascript
export function inheritPrototype(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
}
```
