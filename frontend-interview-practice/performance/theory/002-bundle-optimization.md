# Performance: Bundle Optimization & Code Splitting

## Why It Matters
JavaScript bundle size is the single largest contributor to slow page load times. Unlike static images, JavaScript files must be downloaded, decompressed, parsed, compiled, and executed by the browser's main thread. This process (scripting overhead) blocks user interactions, leading to poor Total Blocking Time (TBT) and Interaction to Next Paint (INP) scores. A senior developer must know how to split bundles, configure tree-shaking, and leverage prefetching/preloading to deliver lightweight, fast-loading applications.

---

## Core Concepts & Mental Models

### 1. Bundle Size and the Scripting Lifecycle
When the browser receives a JavaScript file, it undergoes the following execution stages:
`Download` ──> `Decompress` ──> `Parse (AST)` ──> `Compile (JIT)` ──> `Execute (Run)`
*   *The Main Thread Bottleneck*: Decompressing and compiling JavaScript blocks the browser's main thread. A 1MB JS file can block the thread for 1 to 2 seconds on a budget mobile CPU, even if the user has a fast internet connection.

### 2. Code Splitting Topologies
Instead of sending a single monolithic bundle, slice the code into smaller chunks:
*   **Route-Based Splitting**: Load only the code required for the current active route (e.g. don't load the admin dashboard code when rendering the login page).
*   **Component-Based Splitting**: Lazy-load heavy components that are not visible immediately on load (such as modal popups, charts, or payment gateways).

```javascript
// Dynamic import tells the bundler to split this component into a separate file chunk
const HeavyChart = React.lazy(() => import("./components/HeavyChart"));
```

### 3. Tree-Shaking Mechanics
Tree-shaking is the process of dead-code elimination. It relies on the static structure of **ES Modules (ESM)**:
*   **Static Imports (`import` / `export`)**: Evaluated at build-time. This allows compilers to trace imports and determine which modules are never referenced, discarding them from the final build bundle.
*   **CommonJS (`require` / `module.exports`)**: Evaluated at runtime. Since imports are dynamic (e.g. `if (cond) require()`), compilers cannot analyze dependencies statically, which breaks tree-shaking.

### 4. Resource Hints: Preload vs. Prefetch
*   **`Preload`**: Tells the browser to download a high-priority resource immediately because it is needed for the *current* page (e.g. hero images, critical fonts, or CSS files).
    ```html
    <link rel="preload" href="critical-font.woff2" as="font" type="font/woff2" crossorigin />
    ```
*   **`Prefetch`**: Tells the browser to download a low-priority resource during idle periods because the user is likely to navigate to it *next* (e.g. prefetching Page 2 assets while the user is still reading Page 1).
    ```html
    <link rel="prefetch" href="page-2-bundle.js" as="script" />
    ```

---

## Real-World Case Study / Examples

### Eliminating Bloated Libraries from Initial Loads
A portal was loading a heavy date manipulation library (`moment.js`) and a utility helper (`lodash.js`) in its main bundle, leading to a 350KB bundle increase.

**Fix**:
1.  Replace `moment.js` (which is not tree-shakable and has a large footprint) with a lightweight, ESM-native alternative like `date-fns` or `dayjs`.
2.  Refactor Lodash imports to import specific helper modules:
    ```javascript
    // Bad: Imports all of Lodash
    import _ from "lodash";
    
    // Good: Imports only the required helper, allowing tree-shaking
    import debounce from "lodash/debounce";
    ```
3.  This reduced the main bundle size by 300KB, improving TBT by 450ms.

---

## Common Interview Traps

### The "Dynamic Import Template Literals" Trap
*   **The Trap**: Writing dynamic imports with fully dynamic variables:
    ```javascript
    import(someVariable);
    ```
*   **The Reality**: Bundlers cannot determine what file to split. To make dynamic imports work, specify at least a partial path structure so the bundler can locate the target directory:
    ```javascript
    import(`./components/${componentName}.js`);
    ```

---

## Junior vs. Senior View

*   **Junior View**: "Optimization means running `npm run build`. If the app is slow, let Webpack handle it, or use standard dynamic imports for everything to be safe."
*   **Senior View**: "Optimize JS delivery by structuring static ESM imports, configuring tree-shaking exports, and splitting bundles into route and component chunks. Manage resource loading priorities using preload hints for critical above-the-fold assets and prefetch hints for downstream routes to minimize blocking times (TBT)."

---

## Related Interview Questions
1. "How does Webpack's `SplitChunksPlugin` determine how to group shared dependencies?"
2. "Why does configuring `"sideEffects": false` in package.json enable more aggressive tree-shaking?"
3. "Explain the differences in network priority when using `<link rel="preload">` vs `<link rel="prefetch">`."
4. "How does the browser prioritize asset downloads when parsing the DOM?"
