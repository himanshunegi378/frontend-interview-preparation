# Quiz: Large-Scale Architecture & Monorepos

## Questions

### Question 1 (Medium - React Singleton Violations in Module Federation)
A container application loads a remote sub-application dynamically via Webpack Module Federation. When a page component inside the sub-application is rendered, the browser console throws:
`Uncaught Error: Invalid hook call. Hooks can only be called inside the body of a function component.`
What is the root cause of this error in the context of Module Federation, and how do you resolve it in the Webpack configuration?

---

### Question 2 (Hard - Turborepo Cache Invalidation Tuning)
In a monorepo containing multiple apps and a shared helper library `packages/utils`, modifying a `README.md` or a `.spec.ts` test file inside `packages/utils` causes Turborepo to invalidate its build cache and rebuild all applications during CI pipeline runs.
How do you configure the Turborepo pipeline (`turbo.json`) to ignore non-production source changes (like documentation or tests) from triggering cache invalidations?

---

### Question 3 (Senior - Cross-Application Routing Bridge)
When implementing a micro-frontend architecture, the container host shell manages the outer layout and primary navigation (using React Router), while the sub-app (compiled as a remote bundle) contains its own internal routing logic. 
What routing bugs occur when navigating inside the sub-app, and how do you design a routing synchronization bridge to keep the browser's address bar and both router states in sync?

---

## Answer Key & Explanations

### Question 1: Double React Instance Allocation
- **Difficulty:** Medium
- **Answer:** 
  The error occurs because the browser has loaded **two separate instances of React** in memory—one for the container host and one for the remote sub-app.
- **Explanation:**
  - React hooks maintain state inside a global internal variable within the active React library instance.
  - If a sub-application does not share the host's React instance and instead downloads its own physical React copy, there are two distinct React instances in the browser memory.
  - When the sub-app component executes, it calls a hook. The Hook executes under one React instance, but is rendered under the other React instance's reconciler tree, triggering the "Invalid hook call" exception.
- **Fix**:
  Configure Webpack's `ModuleFederationPlugin` to treat React as a **singleton** in both the host and the remote Webpack configs:
  ```javascript
  shared: {
    react: {
      singleton: true, // Force the browser to use a single instance
      requiredVersion: deps.react, // Ensure matching version ranges
    },
    "react-dom": {
      singleton: true,
      requiredVersion: deps["react-dom"],
    }
  }
  ```
- **Senior-Level Insight:** When using singletons, ensure remote sub-apps are loaded asynchronously (using dynamic imports) to give Webpack's module loader time to negotiate dependencies before executing any code that requires React.

---

### Question 2: Turborepo Task Inputs Matching
- **Difficulty:** Hard
- **Answer:** 
  Modify the `inputs` property of the build task in `turbo.json` to explicitly list source globs and exclude files that do not affect the compilation output.
- **Explanation:**
  - By default, Turborepo hashes all files inside a package workspace to determine if the build task is fresh.
  - To prevent changes in tests or markdown documentation from invalidating caches, configure the `inputs` array to target only production source files, excluding tests and markdowns:
    ```json
    {
      "$schema": "https://turbo.build/schema.json",
      "pipeline": {
        "build": {
          "dependsOn": ["^build"],
          "outputs": ["dist/**", ".next/**"],
          "inputs": [
            "src/**/*",
            "package.json",
            "tsconfig.json",
            "!src/**/*.spec.ts",
            "!src/**/*.test.ts",
            "!README.md"
          ]
        }
      }
    }
    ```
  - The `!` prefix tells Turborepo to exclude those globs from the hash calculation.
- **Senior-Level Insight:** Fine-tuning build inputs and outputs is vital for maintaining fast CI feedback loops. In large monorepos, caching builds correctly can reduce CI durations from 30 minutes to under 3 minutes.

---

### Question 3: History Sync and Routing Communication Bridges
- **Difficulty:** Senior
- **Answer:** 
  The bug is a routing mismatch: clicking a link inside the sub-app updates the sub-app's routing state, but the host shell's router remains unaware of the update. This results in out-of-sync navigation behaviors (e.g. back navigation breaking, or the browser address bar not updating).
  
  To solve this, build a **pub-sub routing bridge** that translates navigation events between the host and remote router history frameworks.
- **Explanation:**
  - Since the sub-app is a remote bundle, we should avoid compiling a hard-coded React Router instance into it (which would couple it to the host's version).
  - Instead, the sub-app router should use an **in-memory history** driver (`createMemoryHistory`) during execution:
    ```javascript
    // Sub-App Initialization Expose:
    export const mount = (el, { onNavigate, initialPath }) => {
      const history = createMemoryHistory({
        initialEntries: [initialPath],
      });

      if (onNavigate) {
        history.listen(({ location }) => onNavigate(location.pathname));
      }

      // Render Sub-App using memory history ...
      return {
        onParentNavigate(nextPathname) {
          if (history.location.pathname !== nextPathname) {
            history.push(nextPathname);
          }
        }
      };
    };
    ```
  - **The Host integration**: When the host mounts the sub-app, it binds its native router history listener to the sub-app's mount handles:
    1.  Passes an `onNavigate` callback that runs `hostHistory.push(path)` when the sub-app router updates.
    2.  Listens to the host's router changes, calling `onParentNavigate(path)` on the mounted sub-app interface to push changes down.
- **Common Mistakes:** Embedding a second Browser History (`createBrowserHistory`) inside the sub-app. Two active browser history listener instances will fight for control of the address bar, causing routing infinite loops and app lockups.
- **Senior-Level Insight:** Decoupling micro-app routers from browser window histories using in-memory history adapters is standard for maintaining clean, sandboxed sub-applications.

---

### Question 4 (Offline Sync Conflict Resolution)
Explain the differences between Last-Write-Wins and CRDT (Conflict-Free Replicated Data Type) strategies.
**Answer:** Last-Write-Wins overrides server state based on clientside request timestamps. CRDTs use commutative merge algorithms to merge changes concurrently without conflicts.
