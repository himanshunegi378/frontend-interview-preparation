# Quiz: Component Library & Design System

## Questions

### Question 1 (Medium - Tree-Shaking Failure)
A consumer installs your component library `@org/design-system` and imports a single element:
```javascript
import { Button } from "@org/design-system";
```
However, upon inspecting their application's production bundle, they find the JavaScript code for the library's heavy `<DatePicker />` and `<Modal />` components is included. 
What packaging configuration defects caused this tree-shaking failure, and how do you resolve them?

---

### Question 2 (Hard - Dynamic Runtime White-Labeling)
You must design a white-label dashboard. Each tenant's custom configuration (e.g. primary color, font size presets, border radiuses) is fetched from a database API at runtime. 
How do you implement a design system styling architecture that dynamically applies these configurations at runtime without recompiling client assets or triggering layout shifts?

---

### Question 3 (Senior - CSS-in-JS vs. CSS Modules Performance)
A team proposes migrating a high-traffic e-commerce portal's shared component library from Emotion (runtime CSS-in-JS) to Vanilla CSS Modules. 
As the senior architect, what performance metrics (such as LCP and INP) and engine-level browser behaviors would you cite to evaluate this migration?

---

## Answer Key & Explanations

### Question 1: CommonJS Packaging & SideEffects Configuration
- **Difficulty:** Medium
- **Answer:** 
  Tree-shaking failed because:
  1. The library was distributed as a single monolithic CommonJS (CJS) bundle instead of an ES Module (ESM) format.
  2. The `package.json` was missing the `"sideEffects": false` declaration.
- **Explanation:**
  - **CommonJS Limitations**: CommonJS imports (`require()`) are evaluated at runtime. Static bundlers (like Webpack or Rollup) cannot safely determine if an import is used and drop it. ES Modules use static syntax (`import/export`) which the bundler can evaluate statically to shake off unused components.
  - **SideEffects Flag**: Static analyzers must play it safe. If a module contains code that does something during import (like adding properties to `window` or inserting styling elements into the head), it has a "side effect".
  - If `"sideEffects": false` is omitted from `package.json`, the bundler assumes files might have side-effects and includes them to avoid breaking the code.
- **Fixes**:
  1. Update rollup/vite to output an ES Module bundle (`es/` or `esm/` target).
  2. Add the exports fields in `package.json` to point the `import` hook to the ESM bundle.
  3. Declare `"sideEffects": false` (or specify only the CSS files: `"sideEffects": ["**/*.css"]`) in `package.json`.
- **Senior-Level Insight:** Test tree-shaking in component libraries by bundling a test application and analyzing the bundle using tools like `webpack-bundle-analyzer` or `rollup-plugin-visualizer` before publishing package updates.

---

### Question 2: Runtime Theme Injection via CSS Variables
- **Difficulty:** Hard
- **Answer:** 
  Implement runtime theming using CSS Custom Properties (CSS variables) scoped to a container element.
- **Explanation:**
  - Establish default design variables in a global stylesheet:
    ```css
    :root {
      --color-primary: #0070f3;
      --border-radius: 4px;
    }
    ```
  - Use these variables inside CSS Modules selectors:
    ```css
    .button {
      background-color: var(--color-primary);
      border-radius: var(--border-radius);
    }
    ```
  - When the client loads, fetch the tenant's configuration from the database. Translate the JSON keys into CSS variable format, and inject them inline as style overrides on the root dashboard container element:
    ```javascript
    function DashboardWrapper({ tenantConfig }) {
      const themeStyles = {
        "--color-primary": tenantConfig.primaryColor,
        "--border-radius": `${tenantConfig.borderRadius}px`,
      };

      return <div style={themeStyles}>{/* widgets */}</div>;
    }
    ```
- **Common Mistakes:** Generating dynamic style tags (`<style>`) on-the-fly inside components at runtime. This causes the browser to re-parse the CSSOM continuously, triggering page-wide layout recalculations and layout shifts (CLS).
- **Senior-Level Insight:** Setting style properties directly on elements updates the DOM inline, bypassing JS-in-CSS runtime engines and avoiding repaint delays.

---

### Question 3: Runtime Scripting Latency and Browser Style Invalidation
- **Difficulty:** Senior
- **Answer:** 
  The migration from runtime CSS-in-JS to CSS Modules is highly justified. Runtime CSS-in-JS degrades INP (Interaction to Next Paint) and LCP (Largest Contentful Paint) because the style sheet parser runs on the client browser's main thread.
- **Explanation:**
  - **Runtime Injection Overhead**: emotion/styled-components evaluates themes and generates unique CSS class hashes inside JavaScript *during component rendering*.
  - This scripting operation takes CPU cycles on every render, blocking the main thread and increasing scripting latency, which directly degrades INP.
  - **Browser Rendering Pipeline Invalidation**: When a runtime CSS-in-JS engine injects a new `<style>` block, it invalidates the browser's CSSOM.
  - The browser is forced to pause JavaScript execution and recalculate the styling rules for all nodes in the DOM tree, leading to layout thrashing.
  - **CSS Modules Efficiency**: CSS Modules compile styles to static `.css` files during build steps.
  - The browser downloads and parses the stylesheet once, before executing React code. Since class strings are static hashes, applying them is equivalent to updating a class name on a standard DOM node, running at native browser speeds.
- **Senior-Level Insight:** For content-heavy consumer portals where SEO, initial load times, and input responsiveness are critical, zero-runtime styling engines (CSS Modules, Tailwind, or CSS-in-JS systems that extract styles at build time like Vanilla Extract) are standard.
