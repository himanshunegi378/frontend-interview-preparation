# Quiz: Infinite Scroll & Virtualized Lists

## Questions

### Question 1 (Medium - Sentinel Trigger Collisions)
A developer implements infinite scroll using an Intersection Observer bound to a bottom loading spinner sentinel. However, on initial page load, the server callback is triggered 5 times in rapid succession, downloading pages 1 to 5 immediately.
What causes this duplicate triggering, and how do you resolve it?

---

### Question 2 (Hard - Scroll Restoration in Infinite Feeds)
A user scrolls down 10 pages in an infinite feed (reaching item 250), clicks on a post to read details, and then clicks the browser's "Back" button. The application resets, scroll position is lost, and the user is placed at the top of the feed (item 1).
Detail the architecture and state management steps required to restore the user's scroll position and cached feed items exactly where they left off.

---

### Question 3 (Senior - ResizeObserver Infinite Layout Loops)
In a virtualized list with variable heights, we attach a `ResizeObserver` to each rendered card to measure its true height and update the height cache. However, running this update in the browser often throws the warning: `ResizeObserver loop limit exceeded`.
Explain the browser mechanics behind this warning, and how a senior developer avoids triggering infinite layout loops.

---

## Answer Key & Explanations

### Question 1: Viewport Sentinel Exposure
- **Difficulty:** Medium
- **Answer:** 
  The multiple triggers occur because the initial data fetch does not return enough items to fill the viewport, leaving the loading spinner sentinel visible on the screen, which continuously fires intersection events.
- **Explanation:**
  - When the page loads, the initial fetch for Page 1 returns 5 items.
  - Because 5 items only occupy 400px of height, they do not fill a standard 1080px viewport height.
  - As a result, the sentinel element at the bottom remains visible in the viewport.
  - The Intersection Observer triggers Page 2, which loads another 5 items. The sentinel is still visible, triggering Page 3, and so on, until the viewport is filled and the sentinel is pushed offscreen.
- **Fixes**:
  1.  **Increase Page Size**: Enforce a minimum page size (e.g. 20 items) to guarantee that the content overflows the screen on the first fetch.
  2.  **State Guards**: Prevent the observer from triggering if a fetch is already in progress:
      ```javascript
      if (entry.isIntersecting && !isLoading && hasMore) {
        loadNextPage();
      }
      ```
  3.  **Hide Sentinel**: Conditionally hide the sentinel element in the DOM when `isLoading` is true.
- **Senior-Level Insight:** Always guard async triggers with state locks (`isLoading`, `hasMore`) to prevent duplicate network hits.

---

### Question 2: Scroll State and Item Cache Restoration
- **Difficulty:** Hard
- **Answer:** 
  To restore the scroll position, you must cache the **accumulated data list**, the **last scroll offset**, and the **measured heights cache** in a persistent client store (like SessionStorage or React Router location state) before navigating away.
- **Explanation:**
  - **The Cache Structure**: When the user clicks a card:
    1.  Capture the current scroll position: `const scrollOffset = container.scrollTop`.
    2.  Save the accumulated data array, the current page index, the heights cache, and the `scrollOffset` to SessionStorage.
  - **The Restoration Steps**: When returning to the feed page:
    1.  Check SessionStorage for cached feed data.
    2.  If found, initialize the feed state with the cached items instead of fetching Page 1.
    3.  Restore the virtualizer's height cache.
    4.  Force the container scroll size to match the cached total height.
    5.  Wait for the DOM to mount, then set `container.scrollTop = scrollOffset`.
- **Common Mistakes:** Relying on the browser's native scroll restoration. Native scroll restoration only works for static HTML documents; for dynamic React apps, the browser tries to restore scroll before the items are fetched, resulting in a scroll reset.
- **Senior-Level Insight:** In single-page apps, scroll restoration is an application responsibility. Keep feed lists cached in memory or SessionStorage to make back-navigation feel instantaneous.

---

### Question 3: ResizeObserver Feedback Loops
- **Difficulty:** Senior
- **Answer:** 
  The warning occurs because style updates made inside the `ResizeObserver` callback trigger a new layout pass *within the same frame*, causing elements to resize again and triggering the observer in an infinite loop.
- **Explanation:**
  - The browser's layout engine processes styles sequentially.
  - If a `ResizeObserver` callback runs, measures an element, and immediately writes a style mutation (e.g., changes element padding or height) to adjust positions, the layout changes.
  - The browser detects that elements resized during the current rendering frame and schedules another resize observation.
  - If this cycle repeats, it creates an infinite feedback loop. To prevent browser freezing, the browser aborts and throws the `ResizeObserver loop limit exceeded` warning.
- **Fixes**:
  1.  **Defer Style Updates**: Wrap the style update inside `requestAnimationFrame` or `setTimeout` to push the style modifications to the next browser execution frame:
      ```javascript
      const observer = new ResizeObserver((entries) => {
        requestAnimationFrame(() => {
          // Perform layout adjustments in the next frame
          updateHeightsCache(entries);
        });
      });
      ```
  2.  **Read-Only Observer**: Enforce that the observer is strictly read-only; it should only record measurements into a cache map and never apply layout changes directly to the monitored elements.
- **Senior-Level Insight:** Treat observers as telemetry sensors. Never couple element measurements to immediate, synchronous style writes. Defer writes to allow the browser to process layouts cleanly.
