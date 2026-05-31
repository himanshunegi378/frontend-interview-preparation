# Quiz: Critical Rendering Path & CSS Performance

## Questions

### Question 1 (Medium - Layout Thrashing Trace)
Does the following code block cause layout thrashing? If so, identify the exact line(s) triggering the forced synchronous layout.
```javascript
const boxes = document.querySelectorAll(".box");

function updateBoxes() {
  boxes.forEach((box) => {
    const parentWidth = box.parentElement.clientWidth;
    box.style.width = `${parentWidth / 2}px`;
    box.style.margin = "10px";
  });
}
```

---

### Question 2 (Hard - Render Blocking Styles)
Consider the following HTML imports. Which of the script tags blocks initial rendering, and which stylesheets are render-blocking?
```html
<head>
  <link rel="stylesheet" href="style1.css">
  <link rel="stylesheet" href="style2.css" media="print">
  <script src="script1.js"></script>
  <script async src="script2.js"></script>
  <script defer src="script3.js"></script>
</head>
```

---

### Question 3 (Senior - CSS-in-JS Runtime Overhead)
Why does runtime CSS-in-JS (like styled-components) suffer from rendering delays during initial page hydration in server-side rendered (SSR) applications? Explain the compilation and style injection sequence.

---

## Answer Key & Explanations

### Question 1: Read/Write Interleaves in Loops
- **Difficulty:** Medium
- **Answer:** Yes, this causes severe layout thrashing.
- **Explanation:**
  - The loop iterates over each `.box`.
  - Inside the loop, `box.parentElement.clientWidth` is a **Read** operation that queries layout geometry.
  - The statement `box.style.width = ...` is a **Write** operation that invalidates the browser's layout state.
  - The second statement `box.style.margin = "10px"` is another **Write** operation.
  - On the next loop iteration, when the code executes the **Read** `box.parentElement.clientWidth`, the browser cannot return a cached value because the previous writes invalidated the layout. The browser is forced to pause execution and calculate the layout synchronously.
  - This cycle repeats on every iteration, leading to forced synchronous layouts (FSL).
- **Fix**: Batch all reads first, then execute writes inside a single block:
  ```javascript
  const widths = Array.from(boxes).map(box => box.parentElement.clientWidth);
  boxes.forEach((box, i) => {
    box.style.width = `${widths[i] / 2}px`;
    box.style.margin = "10px";
  });
  ```
- **Common Mistakes:** Thinking layout thrashing only occurs when reading/writing the same element. Querying *any* parent or sibling geometry after a write triggers the recalculation.
- **Interviewer Follow-up:** "Which DOM read properties trigger forced layout recalculations?" (Any properties that require calculating dimensions: `offsetWidth`, `offsetHeight`, `clientWidth`, `clientHeight`, `scrollTop`, `scrollLeft`, and `getBoundingClientRect()`).
- **Senior-Level Insight:** Use devtools to audit layout performance. Chrome DevTools highlights forced synchronous layouts with red warning triangles in the Performance panel timeline.

---

### Question 2: Parser and Render Blocking Resources
- **Difficulty:** Hard
- **Answer:**
  - **Render-blocking stylesheet**: `style1.css` is render-blocking. `style2.css` is **not** render-blocking because it specifies `media="print"` (it is still downloaded by the browser, but does not block the initial page render).
  - **Parser-blocking script**: `script1.js` is parser-blocking (and render-blocking by extension, as it blocks DOM construction). `script2.js` (`async`) and `script3.js` (`defer`) are **not** parser-blocking because they are downloaded asynchronously in the background.
- **Explanation:**
  - By default, stylesheets are render-blocking because the browser will not paint pixels until it has constructed the CSSOM to prevent Flash of Unstyled Content (FOUC).
  - Normal script tags (`script1.js`) block HTML parsing because the parser must stop, download the script, and execute it before continuing DOM construction.
  - `async` scripts execute as soon as they are downloaded, which can still block the parser temporarily, but they do not block the initial parsing pipeline. `defer` scripts only execute after HTML parsing is complete, ensuring zero parser blocking.
- **Common Mistakes:** Assuming all stylesheets block rendering equally, ignoring media query attributes.
- **Interviewer Follow-up:** "How does the browser handle script tags placed at the bottom of the body?" (Placing script tags at the bottom allows the HTML parser to construct the DOM tree first, preventing scripts from blocking page parsing).
- **Senior-Level Insight:** To optimize initial load metrics (like First Contentful Paint), use `media` queries on links, load critical CSS inline, and use `async` or `defer` for JavaScript tags.

---

### Question 3: SSR Hydration Style Injection Cycles
- **Difficulty:** Senior
- **Answer:** Runtime CSS-in-JS libraries must collect and serialize styles on the server, send them to the client, and then re-inject them into the DOM during client-side hydration, which triggers style parsing and layout invalidation.
- **Explanation:**
  - In SSR, the server pre-renders the HTML. If using CSS-in-JS, the server must run a style extraction pass to extract all CSS classes used by components and output them as inline `<style>` tags in the HTML.
  - When the client receives the HTML, it displays the styled content.
  - However, once the client-side JavaScript loads, React initiates the **hydration phase**.
  - During hydration, the runtime CSS-in-JS library executes, re-evaluating styled components. The library parses the component styles, generates new class hashes, and updates the style tags in the DOM.
  - This update invalidates the browser's CSSOM tree. The browser must recalculate styles, rebuild the render tree, and run layout/paint cycles for the entire page, causing CPU spikes and rendering delays.
- **Common Mistakes:** Assuming SSR completely eliminates the performance overhead of runtime CSS-in-JS.
- **Interviewer Follow-up:** "How do static, zero-runtime CSS-in-JS libraries (like vanilla-extract or Compiled) solve this hydration issue?" (They compile style rules to standard CSS classes during build time, outputting static `.css` files that load like traditional stylesheets without any runtime JS execution or DOM style injection).
- **Senior-Level Insight:** For high-performance products, prefer static CSS compilation (Tailwind, CSS Modules, or build-time CSS-in-JS) to keep the hydration phase light and fast.

---

### Question 4 (Forms Sizing & Browser Compatibility)
Why is `appearance: none` necessary when styling custom checkboxes?
**Answer:** It resets default browser styling overrides, allowing custom widths, heights, background-images, and borders to render consistently across Chrome, Safari, and Firefox.
