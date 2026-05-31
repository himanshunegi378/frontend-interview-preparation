# Quiz: CSS Box Model, Positioning, & Stacking Contexts

## Questions

### Question 1 (Medium - Box Sizing)
An element has the following styling rules. What is the total rendered width and height of this element in the browser under `content-box` vs. `border-box`?
```css
.box {
  width: 300px;
  height: 150px;
  padding: 20px 10px;
  border: 5px solid black;
  margin: 15px;
}
```

---

### Question 2 (Hard - Stacking Order Resolution)
Given the HTML and CSS below, will Item B render on top of or behind Item A? Explain the stacking context resolution step-by-step.
```html
<div class="container-1">
  <div class="item-a">Item A</div>
</div>
<div class="container-2">
  <div class="item-b">Item B</div>
</div>
```
```css
.container-1 {
  position: relative;
  z-index: 10;
}
.item-a {
  position: absolute;
  z-index: 100;
  background: red;
}
.container-2 {
  position: relative;
  z-index: 9;
}
.item-b {
  position: absolute;
  z-index: 1000;
  background: blue;
}
```

---

### Question 3 (Senior - Stacking Context with Transforms)
In this layout, does Item B render on top of or behind Item A? Why does `transform` affect z-index resolution?
```html
<div class="parent">
  <div class="item-a">Item A</div>
  <div class="item-b">Item B</div>
</div>
```
```css
.parent {
  position: relative;
}
.item-a {
  position: relative;
  z-index: 2;
  transform: translate3d(0, 0, 0);
  background: red;
}
.item-b {
  position: absolute;
  z-index: 1;
  background: blue;
}
```

---

## Answer Key & Explanations

### Question 1: Content-box vs. Border-box Dimensions
- **Difficulty:** Medium
- **Answer:**
  - **`content-box`**: Rendered Width is `330px`, Rendered Height is `200px`.
  - **`border-box`**: Rendered Width is `300px`, Rendered Height is `150px`.
- **Explanation:**
  - **Width components**: `width: 300px`, `padding-left/right: 10px + 10px = 20px`, `border-left/right: 5px + 5px = 10px`.
  - **Height components**: `height: 150px`, `padding-top/bottom: 20px + 20px = 40px`, `border-top/bottom: 5px + 5px = 10px`.
  - Under `content-box` (default), padding and border are added to the width/height:
    - Width: `300 + 20 + 10 = 330px`.
    - Height: `150 + 40 + 10 = 200px`.
  - Under `border-box`, padding and border are contained within the width/height:
    - Width: `300px` (content width shrinks to `300 - 20 - 10 = 270px`).
    - Height: `150px` (content height shrinks to `150 - 40 - 10 = 100px`).
  - *Note:* Margin is not part of the element's rendered size, but it occupies space in the document flow.
- **Common Mistakes:** Including margin in the rendered size calculations.
- **Interviewer Follow-up:** "How do you enforce `border-box` sizing globally in a project?" (Use a universal selector reset: `*, *::before, *::after { box-sizing: border-box; }`).
- **Senior-Level Insight:** Universal `border-box` resets prevent padding changes from breaking layout widths, making it easier to manage column sizes.

---

### Question 2: Stacking Context Hierarchy
- **Difficulty:** Hard
- **Answer:** Item B renders **behind** Item A.
- **Explanation:**
  - Both `.container-1` and `.container-2` trigger new stacking contexts because they have `position: relative` and a `z-index` other than `auto`.
  - Since `.container-1` and `.container-2` are sibling elements in the same parent stacking context (the root document), their z-index values are compared.
  - `.container-1` has `z-index: 10`.
  - `.container-2` has `z-index: 9`.
  - Because `.container-1` has a higher z-index, the entire container (including all its children) is stacked on top of `.container-2`.
  - The z-index values of children inside separate stacking contexts are not compared. Even though `.item-b` has `z-index: 1000`, it is trapped within the lower stacking context of `.container-2`, so it renders behind `.item-a` (trapped inside `.container-1`).
- **Common Mistakes:** Expecting `.item-b` to render on top because its z-index (`1000`) is higher than `.item-a`'s z-index (`100`).
- **Interviewer Follow-up:** "How would you fix this layout to make Item B render on top?" (Remove the `z-index` from the parent containers, or change `.container-2`'s z-index to `11`).
- **Senior-Level Insight:** To prevent z-index issues in complex layouts, avoid setting z-index on parent containers unless necessary, and keep overlays flat in the DOM.

---

### Question 3: Painting Order & Transform Stacking
- **Difficulty:** Senior
- **Answer:** Item B renders **behind** Item A.
- **Explanation:**
  - Under W3C specifications, within a single stacking context (in this case, `.parent`), elements are painted in this order (from bottom to top):
    1. Background and borders of the element.
    2. Child stacking contexts with negative z-index.
    3. Normal flow elements (in-flow non-positioned elements).
    4. Positioned elements with `z-index: auto` or `0`.
    5. Stacking contexts with positive z-index (ordered by value).
  - `.item-a` has `position: relative` and `z-index: 2`, placing it in the positive z-index group.
  - `.item-b` has `position: absolute` and `z-index: 1`, placing it in the positive z-index group.
  - Comparing their z-index values, `.item-a` (`2`) is higher than `.item-b` (`1`), so Item A renders on top of Item B.
  - The `transform: translate3d(0, 0, 0)` on `.item-a` triggers a new stacking context, but it does not change its position relative to `.item-b` because both remain evaluated within the same parent context.
- **Common Mistakes:** Thinking that `transform` always forces an element to the top of the stack, or ignoring the z-index comparison.
- **Interviewer Follow-up:** "What happens if we remove `z-index: 2` from `.item-a`?" (If `z-index` is removed, `.item-a` has `z-index: auto` (which acts as `0`). Since `.item-b` has `z-index: 1`, it will render on top of `.item-a`).
- **Senior-Level Insight:** Transform operations (like animations) trigger new stacking contexts, which can cause unexpected rendering changes if z-index values are not managed carefully.
