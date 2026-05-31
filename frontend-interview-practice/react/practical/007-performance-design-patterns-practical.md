# Practical: High-Performance Virtual List Viewport Component

## Problem Title: Fixed-Height List Virtualizer

## Difficulty: Senior

## Skills Tested
- Scroll event tracking and handling
- Index bounds mapping (start/end indexes)
- Dynamic DOM positioning (absolute positioning vs transform translations)
- Memory management and rendering lifecycle optimization

## Problem Statement
Standard list rendering loops (`items.map(...)`) create DOM nodes for every element in the array. When rendering datasets exceeding 5,000 items, the browser consumes massive memory, layout calculations freeze, and scrolling stutters.

Implement a custom, reusable React component `<VirtualList>` that renders only the items currently visible in the scrollable viewport.

```javascript
// Usage Example:
<VirtualList 
  items={massiveArray} 
  itemHeight={50} 
  containerHeight={400} 
  renderItem={(item, index) => <div className="row">{item}</div>} 
/>
```

## Starter Code
```javascript
import React, { useState, useRef, useEffect } from "react";

/**
 * High-performance virtualized list wrapper.
 */
export function VirtualList({ items, itemHeight, containerHeight, renderItem }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Implement
}
```

## Requirements
- The container element must support native browser scrolling.
- Only the items visible within the viewport window must be instantiated in the DOM.
- Include a "buffer" of 2 items above and below the visible viewport to prevent white gaps during rapid scrolling.
- Keep the scrollbar height realistic; the total scrollable area must equal `items.length * itemHeight` so the native browser scrollbar behaves normally.
- Translate (position) visible items to their correct coordinates using CSS absolute positioning or transform values.

## Edge Cases
- Handling rapid scrolling (scroll speed exceeding React state updates).
- Empty `items` array.
- Resize of the container or dynamic prop changes in item height/container height.

## Expected Approach
We will configure the outer container with `height: containerHeight` and `overflowY: "auto"` to capture scroll events.
Inside, we place a dummy "spacer" element with `height: items.length * itemHeight` to set the total scroll size.
We listen to the outer container's `scroll` events and update the `scrollTop` state.
From `scrollTop`, we calculate the first index to render: `Math.floor(scrollTop / itemHeight) - buffer`. We clamp it to `0`.
We calculate the last index to render: `Math.floor((scrollTop + containerHeight) / itemHeight) + buffer`. We clamp it to `items.length - 1`.
We slice the array and render only these items. Each item is absolutely positioned at `index * itemHeight` using `transform: translateY(Ypx)`.

## Solution
```javascript
import React, { useState, useRef, useEffect } from "react";

export function VirtualList({ items, itemHeight, containerHeight, renderItem, buffer = 2 }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  // Handle container scroll event
  const handleScroll = (event) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  // 1. Calculate rendering bounds
  let startIndex = Math.floor(scrollTop / itemHeight) - buffer;
  startIndex = Math.max(0, startIndex); // Clamp to 0

  let endIndex = Math.floor((scrollTop + containerHeight) / itemHeight) + buffer;
  endIndex = Math.min(items.length - 1, endIndex); // Clamp to maximum length

  // 2. Extract active visible items
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      item: items[i],
      index: i,
      offsetTop: i * itemHeight,
    });
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflowY: "auto",
        position: "relative",
        border: "1px solid #ccc",
      }}
    >
      {/* 3. Invisible spacer to establish total height and scrollbar scale */}
      <div style={{ height: totalHeight, width: "100%", position: "absolute", top: 0, left: 0 }} />
      
      {/* 4. Container for rendered elements */}
      <div style={{ width: "100%", position: "absolute", top: 0, left: 0 }}>
        {visibleItems.map(({ item, index, offsetTop }) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: itemHeight,
              transform: `translateY(${offsetTop}px)`,
              willChange: "transform",
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Explanation
- **Dummy Scroll Area**: The element with `height: totalHeight` ensures that the native scrollbar matches the true dataset size, allowing smooth scrolling.
- **Position Translate**: Elements are drawn using `position: absolute` with `transform: translateY(offsetTop)` and `willChange: transform`. This promotes the layer to the GPU, avoiding CPU painting costs as they slide on the screen.
- **Buffer Zones**: Adding a buffer of 2 elements ensures that when scrolling, adjacent rows are pre-loaded in the DOM, preventing a "white flash" layout delay as new nodes mount.

## Time Complexity
- **Scroll Recalculations**: $O(V)$ operations, where $V$ is the number of visible items ($V = \frac{\text{containerHeight}}{\text{itemHeight}} + 2 \times \text{buffer}$). This is independent of the size of `items`, making rendering $O(1)$ relative to total list size.

## Space Complexity
- **DOM Footprint**: $O(V)$ nodes created inside the browser rendering pipeline, saving megabytes of RAM.

---

## Interviewer Follow-ups
1. "How would you optimize this if scrolling was laggy on mobile devices?"
   (Throttle the scroll state updates using requestAnimationFrame, or use CSS scroll-driven animations if possible).
2. "What if items have variable, unpredictable heights (e.g. posts with variable text text loads)?"
   (This requires measuring heights on-the-fly. We render items, measure them using `ResizeObserver`, store their true heights in a cache, and update offsets dynamically. Alternatively, establish a reasonable estimate and patch scroll positions dynamically).

---

## Senior-Level Discussion
Virtualization is a core architectural requirement for data grids and large search listings.
By containing the DOM size to a constant number of nodes, we bypass layout thrashing and garbage collection spikes.
In production setups, utilizing libraries like `react-window` or `react-virtualized` is recommended, but knowing the underlying geometry calculations (`scrollTop`, offsets, and GPU translations) is essential for senior-level systems engineering.

---

### Extra Practice: Accessibility focus rings & Testing
**Task:** Implement an accessible Modal Dialog container in React that manages component refs for keyboard navigation and screen-reader announcements:
```javascript
import React, { useEffect, useRef } from "react";
export function AccessibleModal({ isOpen, onClose, children }) {
  const closeBtnRef = useRef(null);
  useEffect(() => {
    if (isOpen) closeBtnRef.current?.focus();
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">Modal Title</h2>
      <button ref={closeBtnRef} onClick={onClose}>Close</button>
      {children}
    </div>
  );
}
```
