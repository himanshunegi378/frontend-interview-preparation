# Quiz: TypeScript Type Mappings & Conditional Types

## Questions

### Question 1 (Medium - Conditional Type Resolution)
What does the type `Result` resolve to in the following conditional type block?
```typescript
type TypeName<T> = 
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  T extends undefined ? "undefined" :
  T extends Function ? "function" :
  "object";

type Result = TypeName<string | number>;
```

---

### Question 2 (Hard - Infer Keyword Extractors)
Given the function signature type `FetchUser`, write a conditional type `ExtractPayload<T>` that extracts the success data payload type passed to the callback function (the second parameter).
```typescript
type FetchUser = (id: string, callback: (data: { id: string; name: string }) => void) => void;

// Implement:
type ExtractPayload<T> = any;

type UserPayload = ExtractPayload<FetchUser>;
// Expected: { id: string; name: string }
```

---

### Question 3 (Senior - Template Literal Type validation)
Consider the template literal type below. Which of the variables compile successfully, and which fail the compiler check?
```typescript
type EventName = `on${"Click" | "Hover"}${"" | "Active"}`;

const event1: EventName = "onClick";
const event2: EventName = "onHoverActive";
const event3: EventName = "onActive";
const event4: EventName = "onClickactive";
```

---

## Answer Key & Explanations

### Question 1: Distributive Conditional Types
- **Difficulty:** Medium
- **Answer:** `"string" | "number"`
- **Explanation:**
  - Conditional types that act on a generic type parameter (like `TypeName<T>`) become **distributive** when passed a union type.
  - When evaluating `TypeName<string | number>`, the compiler distributes the union and resolves each member separately: `TypeName<string> | TypeName<number>`.
  - `TypeName<string>` evaluates to `"string"`.
  - `TypeName<number>` evaluates to `"number"`.
  - The result is the union type `"string" | "number"`.
- **Common Mistakes:** Expecting the conditional type to evaluate as a single block and default to `"object"`.
- **Interviewer Follow-up:** "How do you prevent a conditional type from distributing when passed a union?" (Wrap the extends arguments in square brackets: `type TypeName<T> = [T] extends [string] ? "string" : ...`).
- **Senior-Level Insight:** Distributive behaviors are standard for utility types (like `Exclude`), but knowing how to disable distribution is crucial when writing validators for collections.

---

### Question 2: Infer in Function Parameter Lists
- **Difficulty:** Hard
- **Answer:**
```typescript
type ExtractPayload<T> = T extends (
  ...args: [any, (data: infer P) => void]
) => void ? P : never;
```
- **Explanation:**
  - We use `extends` to match the shape of the function signature.
  - The function expects two arguments: the first argument is typed as `any`, and the second argument is a callback function `(data: infer P) => void`.
  - By placing `infer P` inside the callback's first parameter position, we tell TypeScript to infer that type and bind it to `P`.
  - If the match is successful, we return `P`, otherwise we return `never`.
- **Common Mistakes:** Forgetting to match the outer function wrapper or nesting `infer` declarations incorrectly.
- **Interviewer Follow-up:** "What happens if the callback function is optional in the signature?" (To support optional callbacks, the argument mapping in the conditional extends pattern must match optional indicators: `callback?: (data: infer P) => void`).
- **Senior-Level Insight:** Using `infer` to extract parameter and return types is the foundation of library wrappers (like Redux action typings or React component prop extractors).

---

### Question 3: Template Literal Type Unions
- **Difficulty:** Senior
- **Answer:**
  - `event1` and `event2` compile successfully.
  - `event3` and `event4` fail to compile.
- **Explanation:**
  - Template literal types compute all combinations of the unions:
    - `"onClick"`, `"onClickActive"`, `"onHover"`, `"onHoverActive"`.
  - `event1` (`"onClick"`) matches.
  - `event2` (`"onHoverActive"`) matches.
  - `event3` (`"onActive"`) fails because it misses the middle action union (`"Click" | "Hover"`).
  - `event4` (`"onClickactive"`) fails due to case-sensitivity (expects `"Active"`, not `"active"`).
- **Common Mistakes:** Assuming template literal types are parsed like loose wildcards or are case-insensitive.
- **Interviewer Follow-up:** "How can you enforce lowercase outputs in template literal types?" (Use TypeScript's intrinsic string manipulation types: `Lowercase<T>`).
- **Senior-Level Insight:** Template literal types are useful for typing string parameters (like state event payloads, BEM class builders, or local storage key configurations).
