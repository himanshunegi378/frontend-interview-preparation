# Quiz: Performance - Bundle Optimization & Code Splitting

## Questions

### Question 1 (Easy/Medium - ESM vs. CommonJS Static Analysis)
Explain why the following import allows the compiler to tree-shake (remove) unused modules in Example A, but fails to do so in Example B:
```javascript
// Example A (ES Modules)
import { map } from "lodash-es";

// Example B (CommonJS)
const { map } = require("lodash");
```

---

### Question 2 (Medium - Webpack Magic Comments & Chunk Naming)
When building a React application, a dynamic import is written as:
```javascript
const AdminPanel = React.lazy(() => import("./AdminPanel"));
```
1.  What filenames does Webpack generate for this lazy-loaded chunk by default?
2.  How do you customize the generated chunk's filename to be human-readable (e.g. `admin-panel.chunk.js`)?
3.  Why is naming chunks beneficial for production debugging?

---

### Question 3 (Senior - Socket Saturation from Over-Preloading)
A developer wants to make their page load as fast as possible. They add `<link rel="preload">` tags for 15 different product images, 3 web fonts, and 4 CSS files in the HTML head.
Instead of speeding up the page, the initial LCP element render slows down, and dynamic API data fetches (`fetch('/api/user')`) are delayed.
Explain the network-level browser mechanisms that caused this performance degradation.

---

## Answer Key & Explanations

### Question 1: Static Module Graphs vs. Dynamic Runtime Evaluation
- **Difficulty:** Easy/Medium
- **Answer:** 
  ES Modules are statically analyzed at compile-time, allowing the compiler to determine and shake off unused exports. CommonJS modules are executed dynamically at runtime, making static dependency resolution impossible.
- **Explanation:**
  - **ES Modules (ESM)**: The syntax `import` and `export` is static. Imports cannot be placed inside `if` statements or loops. This constraints ESM to form a static dependency graph at build time. The bundler parses this graph, identifies unused exports, and omits them from the output bundle.
  - **CommonJS (CJS)**: The `require()` call is a standard JavaScript function executed dynamically during runtime. You can write:
    ```javascript
    if (user.isAdmin) {
      const adminUtils = require(`./admin-${config.type}`);
    }
    ```
  - Because the path and condition can change at runtime, the compiler cannot predict what code is needed at build time. It must bundle the entire library to prevent runtime reference errors.
- **Senior-Level Insight:** When choosing third-party libraries from npm, check if they distribute an ESM build (often indicated by a `module` field in their `package.json`) to keep application bundle sizes low.

---

### Question 2: Webpack Magic Comments and Chunk Separation
- **Difficulty:** Medium
- **Answer:** 
  1.  By default, Webpack assigns numeric increment IDs to dynamic chunks, producing names like `1.js`, `2.js`, or hashes like `chunk-8f9d2.js`.
  2.  You customize the name using **Webpack Magic Comments**:
      ```javascript
      const AdminPanel = React.lazy(() => 
        import(/* webpackChunkName: "admin-panel" */ "./AdminPanel")
      );
      ```
  3.  Named chunks simplify production debugging by matching stack traces and Network tab files to specific source components.
- **Explanation:**
  - Webpack parses the inline comment `/* webpackChunkName: "..." */` at build-time to name the output file chunk.
  - This prevents bundles from appearing as anonymous numbers, making it easier to trace and analyze issues in production environments.
- **Senior-Level Insight:** Magic comments also support directives like `/* webpackPrefetch: true */`, which instructs the browser to prefetch the chunk in the background during idle periods.

---

### Question 3: Socket Saturation & Critical Chain Interference
- **Difficulty:** Senior
- **Answer:** 
  Preloading too many resources saturates the browser's HTTP/1.1 socket connection pool (limited to 6 concurrent connections per domain) with high-priority requests, delaying critical API calls and render-blocking resources.
- **Explanation:**
  - When the browser parses the HTML head, it encounters the `<link rel="preload">` tags.
  - Preloaded assets are queued with **High / Medium priority** and fetched immediately.
  - If 22 preloads are declared, the browser attempts to download them simultaneously.
  - Under HTTP/1.1, the browser can only open 6 concurrent TCP connections to a single domain. The remaining 16 requests are queued.
  - When the browser subsequently encounters critical scripts or runs `fetch('/api/user')` during execution, these requests are stuck in the queue behind the preloaded image files, stalling LCP renders and page interactivity.
- **Common Mistakes:** Thinking that `preload` is merely a hint. Preload is a command that forces the browser to fetch the resource immediately, overriding its default download scheduler.
- **Senior-Level Insight:** Only preload assets that are critical to rendering the initial viewport (like the hero image, primary stylesheet, and main JS bundle). Use `prefetch` (which runs at lowest priority during browser idle periods) for downstream resources.
