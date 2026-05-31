# Quiz: Build Tooling, TypeScript, & Monorepos

## Questions

### Question 1 (Easy/Medium - TypeScript Implicit Any Key Index Signatures)
Given the following TypeScript function:
```typescript
interface UserProfile {
  name: string;
  age: number;
  email: string;
}

function logFieldValue(user: UserProfile, field: string) {
  // Error: Element implicitly has an 'any' type because expression of type 'string'
  // can't be used to index type 'UserProfile'.
  console.log("Field value:", user[field]);
}
```
1.  Explain why the TypeScript compiler throws this error.
2.  Provide two separate, type-safe fixes to resolve it.

---

### Question 2 (Medium - peerDependencies vs. dependencies in Shared Libraries)
When publishing a reusable React UI component library, should `react` and `react-dom` be declared in `dependencies` or in `peerDependencies` inside the library's `package.json`? Explain the package installation differences and the impact on the client bundle size.

---

### Question 3 (Senior - Circular Dependency Runtime Undefined Errors)
A build pipeline completes successfully with zero warnings, but at runtime, the application crashes immediately with:
`TypeError: Cannot read properties of undefined (reading 'fetchDetails')`
The import statement in the failing file is:
`import { fetchDetails } from "./apiService";`
Upon inspection, `apiService.ts` clearly exports `fetchDetails`. Explain how circular module dependencies trigger this runtime `undefined` error, and detail the node/bundler module loading cycle.

---

## Answer Key & Explanations

### Question 1: String-Index Key Constraints
- **Difficulty:** Easy/Medium
- **Answer:** 
  TypeScript throws this error because a string parameter `field` can be *any* string value (e.g. `"status"`), which might not exist on the `UserProfile` interface.
- **Explanation:**
  - `UserProfile` only contains keys `"name"`, `"age"`, and `"email"`.
  - Since `field` is typed as a generic `string`, the compiler cannot guarantee that `user[field]` will not evaluate to `undefined`, violating type safety.
- **Fixes**:
  1.  **Restrict the parameter using `keyof`**:
      ```typescript
      function logFieldValue(user: UserProfile, field: keyof UserProfile) {
        console.log("Field value:", user[field]); // Safe, field is constrained
      }
      ```
  2.  **Add a string Index Signature to the interface** (if the interface is allowed to hold arbitrary keys):
      ```typescript
      interface UserProfile {
        name: string;
        age: number;
        email: string;
        [key: string]: any; // Allows arbitrary string keys
      }
      ```

---

### Question 2: Peer Dependency Singleton Requirements
- **Difficulty:** Medium
- **Answer:** 
  They must be declared in **`peerDependencies`**.
- **Explanation:**
  - **`dependencies`**: If you list `react` here, when a consumer installs the library, the package manager may download and install a nested second copy of React inside the library's `node_modules/react` directory. This creates duplicate React libraries in memory, violating React's singleton hook constraints and inflating bundle sizes.
  - **`peerDependencies`**: Tells the package manager: "Our library requires React, but the hosting application must provide it." The package manager audits that the host has React installed, avoiding duplicate installation.
- **Senior-Level Insight:** In your library's `package.json`, declare the libraries in both `peerDependencies` (for consumers) and `devDependencies` (so you can run tests and compiler checks locally).

---

### Question 3: Circular Module Evaluation Timelines
- **Difficulty:** Senior
- **Answer:** 
  The error triggers because circular dependencies force the JavaScript engine to return an incomplete, partially evaluated module object containing `undefined` values during import evaluations.
- **Explanation:**
  - Suppose File A imports File B, and File B imports File A.
  - **The Loading Cycle**:
    1.  The engine starts parsing File A.
    2.  It encounters the import statement: `import { fetchDetails } from "./FileB"`.
    3.  It pauses evaluation of File A, places A in its module cache as "incomplete", and starts parsing File B.
    4.  Inside File B, it encounters: `import { helper } from "./FileA"`.
    5.  It checks its module cache, finds File A, and returns its *current, incomplete* exports object to File B to prevent infinite loading loops.
    6.  Because File A's execution was paused on line 2, its exports (like `helper`) are not evaluated yet, so File B receives `undefined`.
    7.  File B finishes execution, and the engine resumes compiling File A.
    8.  When File A executes code that calls B's imported functions, those functions access the undefined exports from A, triggering the runtime crash.
- **Fixes**:
  - Run tools like `madge` in your build pipelines to scan code and flag circular dependencies.
  - Refactor cyclic connections by extracting shared variables to a third, independent helper file, resolving the loop.
- **Senior-Level Insight:** Circular dependencies are hard to debug because compile tools often build successfully, and errors only surface at runtime. Keep module imports clean and flowing in one direction (a directed acyclic graph).

---

### Question 4 (TypeScript Import Conflicts)
Why do circular module imports trigger runtime errors where imported objects are evaluated to `undefined`?
**Answer:** The compiler compiles elements in sequence. If a cycle is present, the module is fetched before its exports are compiled, returning `undefined`.
