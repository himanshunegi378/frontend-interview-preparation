# Quiz: Performance - Profiling & Debugging

## Questions

### Question 1 (Easy/Medium - Shallow Size vs. Retained Size)
When inspecting JavaScript heap memory allocations using a Chrome DevTools Heap Snapshot, you encounter two columns representing memory size:
1.  **Shallow Size**
2.  **Retained Size**
What is the difference between these two measurements, and why is "Retained Size" the critical metric to look at when hunting memory leaks?

---

### Question 2 (Medium - Diagnosing Render Triggers in React Profiler)
You recorded a profile of a slow list update using the React Profiler. You locate a heavy component row showing a yellow render bar (indicating high scripting time). 
How do you determine **why** this component rendered (e.g., whether it was caused by a state change, a specific prop mutation, or simply parent propagation)? What DevTools configurations must be enabled?

---

### Question 3 (Senior - Visual Indicators of Layout Thrashing in Performance Traces)
If an application is experiencing layout thrashing (Forced Synchronous Layouts) during scroll interactions, describe the exact visual warnings, track colors, and call stack structures you would search for inside a recorded **Chrome Performance tab trace**.

---

## Answer Key & Explanations

### Question 1: Memory Allocation Definitions
- **Difficulty:** Easy/Medium
- **Answer:** 
  **Shallow Size** is the memory held directly by the object itself (usually for its own properties and primitive types). 
  **Retained Size** is the total memory freed if the object is garbage collected (including the sizes of other objects it holds references to).
- **Explanation:**
  - An object like an array contains references to other objects (e.g. 100 objects of 10KB each).
  - The *Shallow Size* of the array is small (just the array container references, e.g. 80 bytes).
  - The *Retained Size* of the array is large (80 bytes + $100 \times 10\text{KB} \approx 1\text{MB}$), because deleting the array frees all referenced child objects from memory.
- **Senior-Level Insight:** When searching for memory leaks, sort objects by **Retained Size** descending. This exposes parent objects (like caches or event listeners) that are keeping large arrays or trees alive in memory, helping identify the root cause of leaks.

---

### Question 2: Profiler Render Trigger Audits
- **Difficulty:** Medium
- **Answer:** 
  Enable the **"Record why each component rendered"** setting inside React DevTools, select the component node in the Flamegraph, and inspect the list of changed props and states.
- **Explanation:**
  - By default, the React Profiler only records *when* and *how long* a component took to render. It does not record the details of what changed.
  - To trace the cause:
    1.  Open React DevTools settings (gear icon).
    2.  Check the box: **"Record why each component rendered"** under the Profiler tab.
    3.  Record a new profile trace.
    4.  Click on the yellow component bar.
    5.  The right-side sidebar will display a detailed breakdown, e.g.:
        *   `Props changed: [onDelete]`
        *   `State changed: [items]`
        *   `Parent component rendered`
- **Senior-Level Insight:** This feature is invaluable. If it reports `Props changed: [callback]`, it indicates callback reference instability (missing `useCallback`). If it reports `Parent component rendered`, the component can be optimized using `React.memo` or element slots.

---

### Question 3: Layout Thrashing Visual Trace Signatures
- **Difficulty:** Senior
- **Answer:** 
  Layout thrashing is signaled in the Performance trace by a sequence of **red warning flags** at the top of the Flame Chart, repeating **purple layout segments**, and a **sawtooth CPU scripting pattern** with high rendering times.
- **Explanation:**
  - **The Warning Flags**: Webpack/Chrome flags layout thrashing with a red triangle marker at the top of the main thread flame chart. Clicking the task displays a warning in the summary pane: **"Forced Reflow"** or **"Forced Synchronous Layout"**, indicating code that queries layouts after style modifications.
  - **The Call Stack Pattern**: In the Main thread flame chart, locate the JS execution block. If layout thrashing is occurring, you will see a repeating pattern: a JavaScript callback is called, immediately followed by a purple block labeled **"Layout"** (or Recalculate Style), followed by another JS callback, followed by another "Layout" block:
    `[ JS Execute ] ──> [ Layout ] ──> [ JS Execute ] ──> [ Layout ]`
  - **The Summary Pane**: Select the purple Layout block to inspect the code line number that triggered it, pointing directly to the offending file and property (e.g. `element.offsetHeight`).
- **Senior-Level Insight:** In healthy applications, style recalculations and layout passes appear as a single, consolidated block at the end of the JS execution frame. Multiple interleaved layout blocks inside a single JS task are the primary cause of frame drops and input stutters.

---

### Question 4 (Chrome DevTools Performance Timeline)
Describe how to identify long scripting tasks and layout shifts in the Performance panel.
**Answer:** Look for red warning bars on the main thread track (long tasks > 50ms) and inspect the Layout Shifts row to locate element displacement nodes.
