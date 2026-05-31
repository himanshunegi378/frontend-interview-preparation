# Quiz: Real-Time Enterprise Dashboard & Data Table

## Questions

### Question 1 (Medium - Table Sorting Script Latency)
A developer implements client-side sorting for a table displaying 5,000 rows. Every row contains multiple custom cells (dates, currencies, status badges). When a column header is clicked, the UI freezes for 300ms before displaying the sorted results. 
What is the root cause of this lag, and how would you resolve it?

---

### Question 2 (Hard - Preventing Dashboard "Render Storms")
A real-time metrics dashboard receives up to 150 WebSocket updates per second across 12 distinct metric panels. Despite using a global state manager (like Redux or Zustand), the browser CPU utilization spikes to 100%, and the UI becomes unresponsive. 
Why does this happen, and what structural changes are needed to mitigate this?

---

### Question 3 (Senior - Screen Reader Interactions in Virtualized Tables)
List virtualization solves DOM node bloat by unmounting rows that scroll out of the viewport. 
However, how does this node recycling affect screen-readers, and what steps must you take to ensure that visually impaired users can still navigate the table?

---

## Answer Key & Explanations

### Question 1: Heavy Computations & Synchronous Sorting
- **Difficulty:** Medium
- **Answer:** 
  The UI freeze is caused by executing expensive custom sort algorithms synchronously on the browser's single main thread, combined with immediate layout reflows when 5,000 DOM rows are updated.
- **Explanation:**
  - Standard sort comparisons (`Array.prototype.sort`) are quick. However, if the compare function contains complex logic (such as converting string dates to date objects, parsing currency symbols, or rendering JSX nodes on-the-fly), the calculation time scales linearly.
  - Doing this synchronously blocks the main thread, resulting in a frame drop.
- **Fixes**:
  1.  **Web Workers**: Offload the sorting calculation. Pass the array of data to a background Web Worker, sort it there, and pass the sorted array back to the main thread.
  2.  **State Normalization**: Pre-parse and normalize raw data values (e.g. store dates as Unix timestamps, currencies as raw floats) so the compare function only evaluates simple numbers, speeding up sorting.
  3.  **Virtualization**: If the table is not virtualized, updating the DOM for 5,000 rows causes layout thrashing. Virtualizing the table reduces DOM updates to only 20 visible rows, making updates instant.
- **Senior-Level Insight:** In enterprise applications, never calculate raw values inside render functions or sort comparators. Pre-compute and normalize data fields on ingest.

---

### Question 2: Render Storms & State Selector Decoupling
- **Difficulty:** Hard
- **Answer:** 
  The freeze is caused by "Render Storms," where high-frequency state updates trigger full React component tree diffing and layout updates, overwhelming the browser.
- **Explanation:**
  - If a global store updates state 150 times per second, React schedules 150 render cycles per second.
  - Even if virtual DOM diffing is fast, doing it for 12 complex widgets at that frequency runs faster than the browser's paint cycle (usually 16.7ms for 60Hz screens).
- **Fixes**:
  1.  **Update Batching (Throttling)**: Collect incoming WebSocket frames in an in-memory buffer queue. Use a throttle loop to write updates to the React state manager only once every 250ms, reducing updates to 4 times per second.
  2.  **Strict State Selectors**: Ensure components use specific selectors (e.g., `useStore(state => state.widgets[id])`). This avoids parent container renders and ensures only the target widget's sub-tree is diffed.
  3.  **Direct DOM Updates (Ref Bypass)**: For extremely high-speed tickers, bypass React rendering entirely. Have widgets hold refs to their elements and update the text directly (`elRef.current.textContent = value`) inside the stream buffer flush callback.
- **Senior-Level Insight:** React is not designed to handle real-time data ticks directly. Treat the React state loop as a display coordinator, and batch rapid updates into buffered queues before committing them.

---

### Question 3: Accessibility Challenges in Virtual Tables
- **Difficulty:** Senior
- **Answer:** 
  Virtualization breaks standard keyboard focus and screen reader navigation because DOM nodes outside the viewport do not exist, preventing screen readers from scanning the full dataset or focusing offscreen cells.
- **Explanation:**
  - Screen readers navigate tables by traversing the DOM tree. In a virtualized grid, since only 20 rows exist in the DOM out of 100,000, screen readers assume the table only has 20 rows.
  - Tabbing through cells fails when a user tabs past the last visible row because the next target node does not exist in the DOM yet.
- **Fixes**:
  1.  **Set Table Boundaries**: Apply `aria-rowcount={100000}` on the grid container, and `aria-rowindex={index}` on each visible row. This tells the screen reader the table's true size and location, even though offscreen rows are not present in the DOM.
  2.  **Coordinate Keyboard Events**: Capture `ArrowUp`, `ArrowDown`, `Tab`, and `Shift+Tab` events on the grid. If a keyboard navigation moves to an offscreen row, programmatically adjust the container's `scrollTop` to force that row to mount, and then shift DOM focus to the new node.
  3.  **Use focusable containers**: Set `tabIndex={0}` on the grid container and manage active cell focus using `aria-activedescendant` to avoid moving native DOM focus.
- **Senior-Level Insight:** When designing virtual lists for accessible dashboards, choose established, audited libraries (like `react-window` combined with `aria-grid` guidelines) to ensure compliance with ADA/Section 508 standards.
