# Quiz: CSS Responsive Design & Container Queries

## Questions

### Question 1 (Medium - Fluid Typography Limits)
Given the CSS rule below, what is the computed font size of the title when the browser viewport width is `400px` vs. `1200px`?
Assume `1rem = 16px` and the browser is not zoomed.
```css
.title {
  font-size: clamp(24px, 2vw + 16px, 32px);
}
```

---

### Question 2 (Hard - Container Query Scoping)
Given this HTML structure and CSS, what is the text color of the card header?
```html
<div class="sidebar-container">
  <div class="main-container">
    <div class="card">
      <h2 class="card-header">Responsive Header</h2>
    </div>
  </div>
</div>
```
```css
.sidebar-container {
  width: 300px;
  container-type: inline-size;
  container-name: sidebar;
}

.main-container {
  width: 800px;
  container-type: inline-size;
  container-name: main;
}

@container main (min-width: 500px) {
  .card-header { color: red; }
}

@container sidebar (max-width: 400px) {
  .card-header { color: blue; }
}
```

---

### Question 3 (Senior - Container Sizing Loop Prevention)
Why does the CSS specification restrict container queries to `inline-size` or `size` contexts, but forbids querying layouts based on heights (`block-size`) without explicit dimension definitions? Explain how layout loops are prevented.

---

## Answer Key & Explanations

### Question 1: Clamp Range Boundary Limits
- **Difficulty:** Medium
- **Answer:**
  - Viewport width `400px`: computed font size is `24px`.
  - Viewport width `1200px`: computed font size is `32px`.
- **Explanation:**
  - The `clamp(MIN, VAL, MAX)` function resolves the middle expression `VAL` and clamps it between `MIN` and `MAX`.
  - Expression: `2vw + 16px`.
  - **At 400px viewport**: `1vw = 4px`. `2vw = 8px`. `VAL = 8px + 16px = 24px`. Since `24px` equals the `MIN` value `24px`, the output is `24px`.
  - **At 1200px viewport**: `1vw = 12px`. `2vw = 24px`. `VAL = 24px + 16px = 40px`. Since `40px` is larger than the `MAX` value `32px`, it is clamped to `32px`.
- **Common Mistakes:** Forgetting to convert `vw` dynamically or failing to apply the upper/lower boundaries.
- **Interviewer Follow-up:** "How does setting the user font preferences affect this calculation?" (Since `rem` is omitted in the clamp definition, if a user changes their default browser font size, the layout will not scale, violating accessibility recommendations. To fix this, convert `16px` to `1rem`).
- **Senior-Level Insight:** Fluid typography ensures clean styling scaling, reducing the number of media queries in your stylesheets.

---

### Question 2: Container Name Matching Scopes
- **Difficulty:** Hard
- **Answer:** `red`
- **Explanation:**
  - `.card` is nested inside both `.main-container` (width `800px`, named `main`) and `.sidebar-container` (width `300px`, named `sidebar`).
  - The first query `@container main (min-width: 500px)` targets the container named `main`. Since `main`'s width is `800px` (which is $\ge 500px$), this rule is valid, setting the header color to `red`.
  - The second query `@container sidebar (max-width: 400px)` targets the container named `sidebar`. Since `sidebar`'s width is `300px` (which is $\le 400px$), this rule is also valid, setting the color to `blue`.
  - If multiple CSS rules are valid, specificity and order of appearance in the stylesheet determine the final style.
  - Both selectors are `.card-header` (identical specificity `0,1,0`).
  - Since the `@container sidebar` rule appears after `@container main`, it overrides the previous rule by order of appearance.
  - Wait, let's verify if the nesting order affects this. The container query evaluates the rules. Both rules target `.card-header`. The style sheet order is: first `@container main`, then `@container sidebar`.
  - Wait! Let's double check. Is `.card-header` matched? Yes. The stylesheet rules are applied. Since both selectors match and have equal specificity, the rule declared last wins. The color is `blue`.
  - Wait! Let's re-read: `.sidebar-container` has width `300px`. `.main-container` has width `800px`.
  - The query `@container sidebar (max-width: 400px)` is evaluated: `sidebar` is `300px`, which is indeed $\le 400px$.
  - Yes! The stylesheet order evaluates. Since `@container sidebar` is written last, it wins the order of appearance. The final color is `blue`!
  - Wait, let me review the answer. If the stylesheet order is:
    - `@container main (min-width: 500px)` -> `red`
    - `@container sidebar (max-width: 400px)` -> `blue`
    - The rule declared last in the stylesheet takes precedence when specificity is equal. Therefore, the color is `blue`.
- **Common Mistakes:** Assuming that the nearest ancestor container query always wins, regardless of stylesheet declaration order.
- **Interviewer Follow-up:** "How can we force a query to look only at its immediate parent container?" (Omit the container name from the query: `@container (min-width: 500px)`. This will target the nearest ancestor that defines a containment context).
- **Senior-Level Insight:** Naming containers allows you to query specific structural wrappers, making it easier to manage styles when components are deeply nested.

---

### Question 3: Layout Loop Prevention in Container Queries
- **Difficulty:** Senior
- **Answer:** Querying a container's size can modify the size of its children, which could recursively change the size of the container itself, creating an infinite layout loop.
- **Explanation:**
  - If a container query allowed changing styles based on height (`block-size`), and the child responded by changing its height (or font size, which changes element heights), the container's height would change.
  - This height change would re-trigger the container query, changing the child's height again, creating an infinite loop that crashes the rendering engine.
  - To prevent this, the CSS Containment specification requires setting `container-type: inline-size` (which only queries width, isolating it from child height modifications) or using `container-type: size` (which queries both width and height but requires the container to have an explicitly defined, static height, preventing child content from modifying it).
- **Common Mistakes:** Expecting container queries on height to work dynamically on containers that have auto heights.
- **Interviewer Follow-up:** "How does the `contain` property relate to container queries?" (The `contain` property allows developers to explicitly tell the browser to isolate parts of the DOM tree for layout, paint, or size calculations, boosting performance).
- **Senior-Level Insight:** Understanding layout loop limits helps you select the correct containment properties and structure layout containers safely.
