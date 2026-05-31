# CSS Cascade, Specificity, Inheritance, Viewport Units, & Variables

## Why It Matters
Senior frontend engineers must understand CSS cascade and specificity to build modular, predictable styles in large codebases. Inconsistent styling rules cause style leaks, require high maintenance overhead, and lead to the anti-pattern of using `!important`. Furthermore, mastering modern viewport units and CSS variables is key to building responsive, themeable, and performant design systems.

---

## Core Concepts & Mental Models

### 1. The CSS Cascade Engine
The cascade is the algorithm browsers use to resolve conflicting style declarations. It filters declarations through a series of sorting stages:
1. **Origin & Importance**: User-Agent styles (browser defaults) < User Styles < Author Styles (developer code) < Author `!important` < User `!important` < User-Agent `!important`.
2. **Context**: Shadow DOM boundaries vs. Light DOM.
3. **Specificity**: Calculated based on selector weight.
4. **Order of Appearance**: The last declared rule wins if all other stages are equal.

### 2. Specificity Calculation Weight
Specificity is calculated as a three-column vector `(A, B, C)`:
- **A (ID Selectors)**: E.g., `#header`.
- **B (Class, Attribute, and Pseudo-classes)**: E.g., `.button`, `[type="text"]`, `:hover`.
- **C (Type and Pseudo-elements)**: E.g., `div`, `::before`.

*Note:* Inline styles (`style="..."`) override author stylesheets entirely (equivalent to winning the column before A). `!important` is not a selector but immediately wins the origin phase. Pseudo-classes like `:not()`, `:is()`, and `:has()` do not add specificity themselves, but their weight is determined by the most specific selector inside their arguments. `:where()` has `0,0,0` specificity regardless of its contents.

### 3. Inheritance Control
Not all CSS properties inherit from parent to child. Text properties (`color`, `font-family`, `line-height`) inherit by default, while layout properties (`margin`, `padding`, `border`, `display`) do not. We control inheritance using:
- `inherit`: Forces a property to adopt its parent's computed value.
- `initial`: Resets a property to its CSS specification default.
- `unset`: Behaves as `inherit` for inherited properties, and `initial` for non-inherited ones.
- `revert`: Resets the property to the browser default stylesheet.

### 4. Modern Viewport Units
To handle mobile address bar expansions, CSS introduced dynamic viewport units:
- **vh / vw**: Static percentage of the initial viewport height/width.
- **svh / svw (Small)**: Viewport size assuming the browser UI elements (like address bars) are fully expanded (taking maximum space).
- **lvh / lvw (Large)**: Viewport size assuming browser UI elements are fully collapsed.
- **dvh / dvw (Dynamic)**: Dynamically resizes as UI elements collapse or expand. (Carries a small layout recalculation performance cost).

### 5. CSS Custom Properties (Variables)
Unlike preprocessor variables (Sass/Less), CSS variables are evaluated at runtime inside the browser.
- They are subject to the cascade and inheritance rules.
- They can be dynamically updated via JavaScript: `el.style.setProperty('--theme-color', 'blue')`.
- They do not trigger repaint cycles if they are used within non-layout properties (like colors), making transitions highly performant.

---

## Real-World Case Study / Examples

### 1. The Dynamic Theme Switcher
Using CSS Custom Properties allows changing themes globally without rebuilding stylesheets or adding heavy class names to every element:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
}

[data-theme="dark"] {
  --bg-primary: #121212;
  --text-primary: #f5f5f5;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease;
}
```
**Benefits:** Decouples theme state from javascript layout managers, boosting performance.

---

## Common Interview Traps

### 1. Specificity Inflation via `:not()`
```css
/* Specifity: 0, 1, 1 */
div:not(.active) { color: red; } 

/* Specifity: 0, 2, 0 */
.container .item { color: blue; }
```
**Trap:** Developers often think pseudo-classes are ignored in calculations, but the arguments *inside* them are counted. Here, `.active` adds a class specificity column, resulting in unexpected style overrides.

---

## Junior vs. Senior View

- **Junior View**: "I write specific classes or add `!important` to make my styles apply. I use px for layouts and rem for font sizing because someone told me to."
- **Senior View**: "I leverage specificity hierarchies, design tokens, and inheritance rules to write highly reusable layouts. I use `:where()` to export base component styles with zero specificity, making them easily overrideable by consumer applications. I use `dvh` to handle mobile Safari address bar shifts, and utilize runtime CSS variables to build efficient theme architectures."

---

## Related Interview Questions
1. "Explain the specificity difference between `.card :is(h1, h2)` and `.card :where(h1, h2)`."
2. "Why does a mobile browser address bar hide/show trigger layout shifts when using `100vh`, and how do `100dvh` or `100svh` solve this?"
3. "How does the browser evaluate fallback values in custom properties (e.g., `var(--a, var(--b, red))`), and what happens if a variable evaluates to an invalid type at runtime?"
4. "How do CSS Cascade Layers (`@layer`) restructure the cascade sorting stages?"
