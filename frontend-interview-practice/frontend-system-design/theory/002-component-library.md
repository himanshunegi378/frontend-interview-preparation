# System Design: Component Library & Design System

## Problem Statement & Context
A growing technology company wants to unify its user experiences across 6 different applications. You are tasked with designing and implementing a shared Component Library and Design System. The system must support light/dark/custom white-label theming, enforce WAI-ARIA accessibility guidelines, maintain a zero-runtime CSS footprint, compile to a tree-shakable bundle, and support independent versioning.

---

## 1. Requirements

### Functional Requirements
- **Design Tokens**: Centralized repository of brand design parameters (colors, spacing, shadows, typography).
- **Core Primitives**: Accessible inputs, buttons, drop-downs, dialog modals, and grid layout systems.
- **Theming Engine**: Dynamic, client-side switching between Light, Dark, and custom White-label profiles.
- **Documentation Playground**: Interactive playground (e.g. Storybook) for testing components.

### Non-Functional Requirements
- **Tree-Shakability**: Ensure application bundlers can exclude unused components during compiles.
- **Performance**: Zero-runtime styling configuration preferred to minimize JavaScript bundle footprint.
- **WAI-ARIA Accessibility**: Complete keyboard accessibility and screen-reader roles out of the box.

---

## 2. Token Pipeline & Styling Architecture

### Design Token Compilation
Design parameters are defined in a platform-agnostic format (such as JSON) and compiled to platform-specific outputs (CSS variables, iOS Swift variables, Android XML) using a token compilation tool like **Style Dictionary**:

```
[ JSON Token Schema ] ──> [ Style Dictionary Compiler ] ──┬──> CSS Custom Properties (--color-primary)
                                                          ├──> JSON / TS tokens
                                                          └──> Tailwind CSS theme mappings
```

### Styling Strategy: CSS Modules with CSS Custom Properties
For component libraries, CSS Modules paired with CSS Variables offer the best balance:
- **CSS Custom Properties**: Allow dynamic, runtime theming (simply update variables on `document.documentElement` or container wrapper nodes).
- **CSS Modules**: Provide scoped selector class hashes (e.g. `.Button__btn--a1b2c`) to prevent styling leaks into consumer codebases.
- **Zero Runtime**: No JavaScript runtime styles compilation overhead (unlike CSS-in-JS libraries like styled-components), improving performance.

---

## 3. Headless UI Component Pattern
To ensure styling flexibility across different product teams, build components using the **Headless UI / Inversion of Control** pattern:
- **Behavior Hook**: Encapsulates state, accessibility keyboard handlers, and ARIA attributes (e.g., `useDialog`).
- **Render UI**: Renders HTML element nodes and binds styling classes (e.g., `<Dialog />`).

```javascript
// Example: Headless Hook
export function useToggleState(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const toggleProps = {
    "aria-expanded": isOpen,
    role: "button",
    tabIndex: 0,
    onClick: () => setIsOpen(prev => !prev),
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    }
  };
  return { isOpen, toggleProps };
}
```

---

## 4. Distribution, Bundling, & Tree-Shaking
To publish the library on npm, bundle it using a packager like **Rollup** or **Vite**:

### Bundle Configurations (`package.json`)
```json
{
  "name": "@org/design-system",
  "version": "1.0.0",
  "main": "./dist/index.cjs.js",
  "module": "./dist/index.esm.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js"
    },
    "./styles.css": "./dist/styles.css"
  },
  "sideEffects": [
    "**/*.css"
  ]
}
```
*   **`module` & `exports`**: Directs modern bundlers to use the ESM bundle, enabling tree-shaking.
*   **`sideEffects`**: Setting this flag tells bundlers whether files contain side-effects. Setting `"sideEffects": false` (or listing only CSS files as side-effects) allows bundlers to safely drop unused imports.

---

## 5. Accessibility, Security, & Theming

### Accessibility (a11y)
*   **Focus Ring**: Never remove `:focus { outline: none }` without replacing it with an accessible focus ring. Use `:focus-visible` to only show the outline to keyboard navigators.
*   **Aria Attributes**: Synchronize states like `aria-expanded`, `aria-hidden`, and `aria-describedby` dynamically in response to state updates.

### Theming
White-label themes are applied by compiling design tokens into a class scope and applying that class to the page container:
```css
:root {
  --color-primary: #0070f3;
}
.theme-dark {
  --color-primary: #000000;
  --color-background: #111111;
}
.theme-custom-brand {
  --color-primary: #ff007f;
}
```

---

## 6. Tradeoffs & Senior-Level Discussion

### Tradeoff: Tailwind CSS vs. CSS-in-JS vs. CSS Modules
*   *CSS-in-JS (e.g. Styled Components)*: High developer experience, automatic styling injection. However, compiling styles in JavaScript has runtime overhead, which can degrade paint scores (LCP, INP).
*   *Tailwind CSS*: Rapid development, utility-first consistency. However, it requires consumer applications to run Tailwind, limits class customization, and leaks classes into DOM strings.
*   *CSS Modules*: Scoped styles, zero-runtime overhead, framework-agnostic. This is the recommended choice for highly reusable component libraries.

### Senior-Level Talking Points
"When architecting component libraries, avoid coupling components to specific styling engines. By using CSS Modules and CSS custom properties, we keep the JS runtime lightweight. By applying headless patterns (like separating state hooks from presentation nodes), we allow product teams to style elements as they see fit while ensuring accessibility features remain intact. Setting `sideEffects: false` in `package.json` ensures unused imports are tree-shaken during compile steps."
