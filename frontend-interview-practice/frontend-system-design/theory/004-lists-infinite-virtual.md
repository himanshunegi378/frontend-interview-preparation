# System Design: Infinite Scroll & Virtualized Lists

## Problem Statement & Context
A content platform (such as a social media feed or image gallery) requires an infinite scroll feed displaying media cards of varying heights. The feed must handle up to 50,000 items, support dynamic image rendering, prevent Cumulative Layout Shift (CLS) when assets load, and maintain 60 FPS scrolling on low-end mobile devices.

---

## 1. Requirements

### Functional Requirements
- **Infinite Scrolling**: Automatically fetch the next page of content when the user approaches the bottom of the feed.
- **Dynamic Content Support**: Render text cards, image widgets, and media frames of variable heights.
- **Data Pruning (Virtualization)**: Unmount offscreen elements to prevent browser memory exhaustion.

### Non-Functional Requirements
- **Zero Scroll Lag**: Ensure scrolling is handled off the main thread where possible (using Intersection Observers).
- **Layout Stability**: Maintain scroll position when content is appended dynamically.
- **Accessibility**: Screen readers must announce when new items are loaded without resetting focus.

---

## 2. Infinite Scroll Architecture: Sentinel vs. Scroll Listeners
There are two main strategies to detect when to load more data:

### 1. Scroll Event Listener (Bad)
Bind a listener to `window.onscroll` and compare coordinates:
```javascript
// Don't do this
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    loadMore();
  }
});
```
*   *Problems*: The scroll event fires dozens of times per second on the main thread, forcing the browser to recalculate element heights continuously (layout thrashing) and causing scrolling stutters.

### 2. Intersection Observer (Good)
Place a hidden "sentinel" element (like a spinner or empty div) at the bottom of the list. Use the **Intersection Observer API** to detect when this sentinel enters the viewport.

```
┌─────────────────────────┐
│     [ Feed Item 1 ]     │
│     [ Feed Item 2 ]     │
│     [ Feed Item 3 ]     │
├─────────────────────────┤  ◄── Viewport Boundary
│   [ Loading Spinner ]   │  ◄── Sentinel Element (Triggers intersection event)
└─────────────────────────┘
```

*   *Benefits*: The browser evaluates intersection checks asynchronously on a separate compositor thread, notifying JavaScript only when the intersection occurs. This keeps the main thread idle and maintains smooth scroll performance.

---

## 3. List Virtualization (Dynamic Heights)
When list items have uniform heights (e.g. 50px rows), calculating start/end indices is trivial. However, for a social media feed with variable text lengths and images, heights are unpredictable.

### The Estimate-and-Adjust Pattern
To virtualize variable-height lists:
1.  **Estimate Heights**: Assign a default height estimate (e.g. 200px) to all items.
2.  **Render Viewport**: Render the subset of items that fall within the estimated viewport.
3.  **Measure actuals**: Once elements mount, use a `ResizeObserver` or read `element.offsetHeight` to measure their true heights.
4.  **Update Cache**: Store the true heights in a cache map.
5.  **Adjust Scroll Position**: Update the parent container's padding offsets to prevent content jumping when the actual heights differ from the estimates.

---

## 4. Preventing Cumulative Layout Shift (CLS)
When images load dynamically inside infinite feeds, they often start with 0px height and expand once downloaded, causing other content to jump:

```
Before Image Loads:           After Image Loads:
┌──────────────────┐          ┌──────────────────┐
│ Card Text        │          │ Card Text        │
├──────────────────┤          │ [ Image Node ]   │ (Pushes button down!)
│ [ Action Button ]│          ├──────────────────┤
└──────────────────┘          │ [ Action Button ]│
                              └──────────────────┘
```

### The Solution: Aspect Ratio Boxes
Enforce the server to return image dimensions (width and height) in the API metadata payload. Before loading the image file, reserve space on the page by applying the aspect ratio in CSS:

```html
<div style="aspect-ratio: 16 / 9; background-color: #eee;">
  <img src="image.jpg" style="width: 100%; height: 100%; object-fit: cover;" />
</div>
```
The box occupies the exact final space immediately, maintaining layout stability when the image finishes downloading.

---

## 5. Tradeoffs & Senior-Level Discussion

### Tradeoff: Infinite Scroll vs. Pagination ("Load More" Buttons)
*   *Infinite Scroll*: High engagement, fluid browsing experience. However, it makes it impossible for users to reach the page footer, breaks the browser's "Back" button (scroll history is lost), and has a higher memory footprint.
*   *Pagination / Load More*: Gives users control, makes bookmarking easy, and has a lighter memory profile. However, it requires manual clicks, introducing friction.

### Senior-Level Talking Points
"When designing feeds handling thousands of items, we must pair Infinite Scroll with List Virtualization. We use Intersection Observer to monitor a bottom sentinel and trigger pagination without blocking the main thread. To support variable card heights, we implement an estimate-and-adjust caching pattern using `ResizeObserver`. Finally, we require the API to return image aspect ratios so we can reserve layout space in advance, keeping the Cumulative Layout Shift (CLS) score close to zero."
