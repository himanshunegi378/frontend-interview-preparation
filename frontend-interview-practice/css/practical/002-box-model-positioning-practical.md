# Practical: Tooltip Positioning Engine

## Problem Title: Viewport-Aware Tooltip Positioning Engine

## Difficulty: Senior

## Skills Tested
- DOM Coordinate Calculations (`getBoundingClientRect`)
- Viewport boundary checks
- Absolute and fixed positioning offsets
- Defensive styling overrides

## Problem Statement
Implement a JavaScript utility function `positionTooltip(target, tooltip, placement)` that calculates and sets the positioning coordinates for a floating tooltip element relative to a target button.

The function must support:
1. **Placements**: `"top"`, `"bottom"`, `"left"`, `"right"`.
2. **Alignment**: The tooltip must be centered along the axis of the target (e.g., `"top"` placement means centered horizontally above the target).
3. **Viewport Collision Detection (Flip)**: If the tooltip overflows the viewport boundary in the requested placement, the engine must automatically flip the placement to the opposite side (e.g., if placed `"top"` but overflows the top of the screen, flip to `"bottom"`).
4. **Window Boundary Clipping**: If a flipped placement still overflows the viewport boundaries (e.g. on small mobile screens), adjust the offsets to keep the tooltip fully visible on screen.

## Starter Code
```javascript
/**
 * Positions a tooltip relative to a target element.
 * @param {HTMLElement} target - The trigger element
 * @param {HTMLElement} tooltip - The floating tooltip container
 * @param {string} placement - Requested placement: 'top' | 'bottom' | 'left' | 'right'
 */
export function positionTooltip(target, tooltip, placement) {
  // Implement positioning logic
}
```

## Requirements
- Tooltip element should use `position: fixed` to bypass parent container stacking contexts and overflow clippings.
- Do not use third-party libraries like Popper.js or Floating UI.
- Accounts for scroll offsets of the window.

## Edge Cases
- **Near Corners**: If the target is in the top-right corner, a `"top"` placement should center horizontally but might overflow the right edge of the screen. The engine must adjust the left offset to keep the tooltip within the viewport.
- **Micro Viewports**: If the tooltip is larger than the viewport, limit its width to match viewport bounds.

## Expected Approach
Retrieve the bounding boxes of both the target and the tooltip using `getBoundingClientRect()`. Calculate the candidate coordinates for the requested placement. Check if these coordinates would cause the tooltip to overflow the viewport boundaries. If an overflow is detected, flip the placement to the opposite side (e.g. top $\leftrightarrow$ bottom, left $\leftrightarrow$ right) and re-verify. If it still overflows, clamp the coordinates to keep the tooltip fully visible within the viewport margins (e.g., left margin $\ge 10px$, right margin $\le viewportWidth - 10px$).

## Solution
```javascript
export function positionTooltip(target, tooltip, placement) {
  if (!target || !tooltip) return;

  // 1. Force fixed positioning to bypass parent overflow clipping
  tooltip.style.position = "fixed";
  tooltip.style.top = "0px";
  tooltip.style.left = "0px";
  tooltip.style.transform = "none";

  const targetRect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 8; // Safety margin from screen edge

  let finalPlacement = placement;
  let top = 0;
  let left = 0;

  // Helper to calculate coordinates
  function calculateOffsets(place) {
    let t = 0;
    let l = 0;

    switch (place) {
      case "top":
        t = targetRect.top - tooltipRect.height - margin;
        l = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        t = targetRect.bottom + margin;
        l = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case "left":
        t = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        l = targetRect.left - tooltipRect.width - margin;
        break;
      case "right":
        t = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        l = targetRect.right + margin;
        break;
    }
    return { top: t, left: l };
  }

  // 2. Calculate initial coordinates
  let offsets = calculateOffsets(finalPlacement);

  // 3. Collision Detection and Flip logic
  const overflows = {
    top: offsets.top < margin,
    bottom: offsets.top + tooltipRect.height > viewportHeight - margin,
    left: offsets.left < margin,
    right: offsets.left + tooltipRect.width > viewportWidth - margin
  };

  const oppositePlacements = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left"
  };

  // Flip if requested side overflows
  if (
    (finalPlacement === "top" && overflows.top) ||
    (finalPlacement === "bottom" && overflows.bottom) ||
    (finalPlacement === "left" && overflows.left) ||
    (finalPlacement === "right" && overflows.right)
  ) {
    const flippedPlacement = oppositePlacements[finalPlacement];
    const flippedOffsets = calculateOffsets(flippedPlacement);

    // Verify if flipped placement is safe
    const flippedOverflows = {
      top: flippedOffsets.top < margin,
      bottom: flippedOffsets.top + tooltipRect.height > viewportHeight - margin,
      left: flippedOffsets.left < margin,
      right: flippedOffsets.left + tooltipRect.width > viewportWidth - margin
    };

    const isFlippedSafe =
      (flippedPlacement === "top" && !flippedOverflows.top) ||
      (flippedPlacement === "bottom" && !flippedOverflows.bottom) ||
      (flippedPlacement === "left" && !flippedOverflows.left) ||
      (flippedPlacement === "right" && !flippedOverflows.right);

    if (isFlippedSafe) {
      finalPlacement = flippedPlacement;
      offsets = flippedOffsets;
    }
  }

  // 4. Boundary Clamping (Slide adjust if still clipping edges)
  top = Math.max(margin, Math.min(offsets.top, viewportHeight - tooltipRect.height - margin));
  left = Math.max(margin, Math.min(offsets.left, viewportWidth - tooltipRect.width - margin));

  // 5. Apply positions
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}
```

## Explanation
- **Fixed Positioning**: By setting `.style.position = "fixed"`, we position the tooltip relative to the viewport. This protects it from parent container configurations like `overflow: hidden` or custom stacking contexts that could clip the tooltip.
- **Bounding Boxes**: `getBoundingClientRect()` returns coordinates relative to the viewport, which aligns perfectly with our `fixed` position coordinates.
- **Flipping & Clamping**: If the primary placement overflows (e.g. top of viewport), the engine attempts to flip it (e.g. bottom). If both sides are constrained, the boundary clamping step slides the coordinates along the axis to keep the tooltip fully visible on screen.

## Time Complexity
- $O(1)$ calculations, calling bounding rect APIs.

## Space Complexity
- $O(1)$ auxiliary space.

## Interviewer Follow-ups
1. "What happens if the parent container is scrollable? Does the tooltip follow the target during scrolling?" (Since the tooltip is `position: fixed`, it will stay in its initial fixed position while the target scrolls away. To fix this, you must bind a window scroll event listener and re-invoke `positionTooltip()` during scroll events).
2. "Why does calling `getBoundingClientRect()` inside a scroll listener cause performance issues?" (It forces synchronous layout updates—layout thrashing. To optimize, debounce or throttle the scroll listener, or use `requestAnimationFrame` to batch the reads).

## Senior-Level Discussion
Positioning overlays (tooltips, select dropdowns, modals) dynamically is a common challenge in design system development. Using `position: fixed` prevents parent container clipping issues but introduces scroll-syncing challenges. Modern CSS offers **CSS Anchor Positioning** (`anchor()`), which delegates these calculations to the browser engine, eliminating layout thrashing and complex JS event listeners.

---

### Extra Practice: Stacking Contexts & z-index positioning
**Task:** Implement CSS rules that ensure a modal dropdown overlay bypasses adjacent card layout offsets without using high arbitrary z-index values:
```css
.card {
  position: relative;
  z-index: 1;
}
.dropdown-overlay {
  position: fixed;
  z-index: 999;
}
```
