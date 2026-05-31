# Quiz: Performance - Rendering & Assets Optimization

## Questions

### Question 1 (Easy/Medium - Responsive Image Selection on Retina Displays)
Given the following image element:
```html
<img src="hero-1200.jpg" 
     srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w" 
     sizes="(max-width: 600px) 400px, 800px" 
     alt="Hero" />
```
Which image file will a modern browser download if the page is loaded on a smartphone with a viewport width of 375px and a **Device Pixel Ratio (DPR) of 2.0** (Retina display)? Show your calculation.

---

### Question 2 (Medium/Hard - DOM Paint Containment with content-visibility)
Explain the purpose of the modern CSS property `content-visibility: auto`. 
How does it optimize rendering on pages with long articles or catalogs? What layout bugs (specifically related to the browser scrollbar) occur if you omit the `contain-intrinsic-size` property?

---

### Question 3 (Senior - React Memo Custom Comparison Pitfalls)
To optimize rendering in a parent list, a developer writes a custom comparison function for a memoized row component:
```javascript
const UserRow = React.memo(({ user, onDelete }) => {
  return (
    <div>
      <span>{user.name} - {user.status}</span>
      <button onClick={() => onDelete(user.id)}>Delete</button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if user ID changes
  return prevProps.user.id === nextProps.user.id;
});
```
Explain the bugs that will occur in this component when the user's status updates, or when the parent component updates. Detail the correct architectural approach.

---

## Answer Key & Explanations

### Question 1: Screen Geometry and DPR Calculations
- **Difficulty:** Easy/Medium
- **Answer:** 
  The browser will download **`hero-800.jpg`**.
- **Explanation:**
  1.  **Evaluate the `sizes` media query**: The viewport width is 375px. Since 375px is less than or equal to 600px (`max-width: 600px`), the browser matches the first rule: `400px`.
  2.  **Apply Device Pixel Ratio (DPR)**: The target CSS layout width is 400px. Because it is a Retina screen with a DPR of 2.0, the physical pixel resolution required is:
      $$\text{Target Width} \times \text{DPR} = 400\text{px} \times 2 = 800\text{px}$$
  3.  **Select from `srcset`**: The browser looks at the `srcset` list for the best match for 800px:
      *   `hero-400.jpg` (400px wide) - Too small.
      *   `hero-800.jpg` (800px wide) - Perfect match.
      *   `hero-1200.jpg` (1200px wide) - Unnecessarily large.
  - Therefore, the browser fetches `hero-800.jpg`.
- **Senior-Level Insight:** Understanding how DPR alters image loading is critical. Always provide high-resolution assets in `srcset` to ensure text and icons look sharp on modern mobile screens.

---

### Question 2: Layout Containment and Scrollbar Jumping
- **Difficulty:** Medium/Hard
- **Answer:** 
  `content-visibility: auto` skips rendering (layout and painting) for offscreen elements. If `contain-intrinsic-size` is omitted, offscreen elements collapse to 0px height, causing the browser scrollbar to jump erratically as the user scrolls.
- **Explanation:**
  - **The Optimization**: When `content-visibility: auto` is applied to an element, the browser checks if it is in the viewport. If it is offscreen, the browser skips rendering its children, saving CPU scripting and painting time.
  - **The Scrollbar Issue**: By default, the browser doesn't know the height of an unrendered element. Without styling instructions, the browser treats its height as `0px`.
  - As the user scrolls down and the element approaches the viewport, the browser suddenly renders the element, causing it to expand from 0px to its actual height (e.g. 500px).
  - This sudden expansion pushes all content below it down, causing the page height to change dynamically. The browser scrollbar jumps and stutters as a result.
  - **The Fix (`contain-intrinsic-size`)**: Assign a placeholder height estimate:
    ```css
    .card-element {
      content-visibility: auto;
      contain-intrinsic-size: 500px; /* Estimated height */
    }
    ```
    This instructs the browser to reserve 500px of space for the unrendered card, preserving layout stability during scroll.
- **Senior-Level Insight:** Use `content-visibility: auto` on long, heavy articles to speed up initial page render times.

---

### Question 3: Custom Memoization and Reference Leakage
- **Difficulty:** Senior
- **Answer:** 
  Two bugs occur:
  1.  If the user's `status` changes (e.g. from "offline" to "online") but the `id` remains the same, the custom comparator returns `true` (claiming props are equal). React will skip rendering, and the UI will continue displaying the stale status.
  2.  If the parent component re-renders, the `onDelete` function reference changes (unless memoized with `useCallback`). Since the custom comparator ignores `onDelete` changes, the child uses a stale closure of `onDelete`, which can fail to execute correctly.
- **Explanation:**
  - Custom memo comparators that compare single fields ignore mutations on other props.
  - If a callback is updated, the child retains a reference to the old callback, leading to stale closures.
- **Fix**:
  Avoid comparing single fields inside nested data objects manually. Instead, ensure the parent updates data immutably (triggering new object references on updates) and use the default shallow equality comparison of `React.memo`:
  ```javascript
  // Fix: Default React.memo with shallow comparison.
  // Ensure the parent wraps onDelete in useCallback.
  const UserRow = React.memo(({ user, onDelete }) => { ... });
  ```
- **Senior-Level Insight:** Custom comparators are error-prone and hard to maintain. Enforce immutable state updates at the data level to allow shallow comparison to work naturally.

---

### Question 4 (Avoiding Render Loops)
Explain why functions passed as inline props trigger child re-renders, and how to avoid them.
**Answer:** Inline functions create new reference objects on every rendering cycle, failing dependency evaluations in `React.memo` components. Avoid this by wrapping callbacks in `useCallback`.
