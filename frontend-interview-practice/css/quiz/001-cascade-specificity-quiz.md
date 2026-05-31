# Quiz: CSS Cascade, Specificity, & Variables

## Questions

### Question 1 (Medium - Specificity Math)
Given the HTML and CSS below, what color is the text inside the `<h1>` element, and what are the specificities of the selectors?
```html
<div id="app" class="wrapper">
  <h1 class="title" id="main-title">Hello World</h1>
</div>
```
```css
#app #main-title { color: red; }
#main-title.title { color: blue; }
div.wrapper h1.title { color: green; }
```

---

### Question 2 (Hard - Variable Failure Fallback)
What is the final computed text color of the button, and how does the browser handle invalid custom property assignments?
```css
:root {
  --primary-color: 20px; /* Invalid value for color property */
}

.button {
  color: red;
}

.button-primary {
  color: var(--primary-color, blue);
}
```
```html
<button class="button button-primary">Click Me</button>
```

---

### Question 3 (Senior - Cascade Layers and Specificity)
Consider the following setup using CSS Cascade Layers (`@layer`). What is the final color of the paragraph element?
```css
@layer base, components;

@layer components {
  p {
    color: red;
  }
}

@layer base {
  #text {
    color: blue;
  }
}
```
```html
<p id="text">Structured Layer Text</p>
```

---

## Answer Key & Explanations

### Question 1: Selector Specificity Weights
- **Difficulty:** Medium
- **Answer:** `red`
- **Explanation:**
  - `#app #main-title` specificity vector: `(2, 0, 0)` (2 ID selectors).
  - `#main-title.title` specificity vector: `(1, 1, 0)` (1 ID, 1 Class).
  - `div.wrapper h1.title` specificity vector: `(0, 2, 2)` (2 Classes, 2 Elements).
  - Comparing column by column starting from the left, `(2, 0, 0)` is the largest specificity, so the first rule wins, and the color is `red`.
- **Common Mistakes:** Summing selectors (e.g. thinking 2 classes + 2 tags is larger than 1 ID). Specificity is a vector comparison, not simple decimal addition (an ID selector always overrides any number of classes).
- **Interviewer Follow-up:** "How would the specificity change if we added `:where(#main-title)` to the selectors?" (Since `:where()` has zero specificity, it would drop the ID's contribution entirely).
- **Senior-Level Insight:** Keep specificity flat and low. In large design libraries, avoid nesting selectors like `.container .menu .item` to prevent specificity battles for users trying to customize styles.

---

### Question 2: Runtime Invalid Values & Inherited Fallbacks
- **Difficulty:** Hard
- **Answer:** The button text will be black (or the parent element's inherited color, typically black/default).
- **Explanation:**
  - When the browser parses `color: var(--primary-color, blue)`, it sees that `--primary-color` exists. Therefore, it does *not* use the fallback value (`blue`).
  - During the computation phase, the browser resolves `color: 20px`. The value `20px` is invalid for the `color` property.
  - According to the CSS Custom Properties specification, when a custom property resolves to an invalid value for the target property at runtime, the browser does not revert to previous stylesheet declarations (like `color: red`). Instead, it treats the property as if it were set to `unset`, reverting to its inherited value if the property inherits (like `color`), or its initial value if it does not.
  - Since the parent element has no color set, it defaults to the user-agent color (typically black).
- **Common Mistakes:** Expecting the color to fall back to `blue` or revert to `red`.
- **Interviewer Follow-up:** "How does the Houdini CSS Properties and Values API (`@property`) prevent this issue?" (By registering the variable's type, syntax, and fallback values at parse time, allowing invalid types to be rejected immediately).
- **Senior-Level Insight:** CSS variables resolve their values at runtime. Take care when updating CSS variables via JS to ensure value types match property constraints, otherwise styles can break silently.

---

### Question 3: Cascade Layer Overrides
- **Difficulty:** Senior
- **Answer:** `red`
- **Explanation:**
  - The `@layer base, components;` statement establishes a layer order where `components` overrides `base`.
  - In the CSS Cascade, Layer order is evaluated *before* selector specificity. Declarations in later layers always override declarations in earlier layers, regardless of the selector specificity used inside those layers.
  - Since `components` comes after `base` in the layer order, the styles inside the `components` layer (`color: red`) override the styles inside `base` (`color: blue`), even though the base selector `#text` (specificity `1,0,0`) is much more specific than the components selector `p` (specificity `0,0,1`).
- **Common Mistakes:** Assuming selector specificity overrides layer order.
- **Interviewer Follow-up:** "What happens if we append `!important` to the base layer style (`color: blue !important`)?" (With `!important`, the layer override order is reversed: base `!important` overrides components `!important`, so it would print `blue`).
- **Senior-Level Insight:** Cascade Layers are a powerful tool for resetting specificity wars in large enterprise products, allowing you to isolate utility overrides, design systems, and base resets.
