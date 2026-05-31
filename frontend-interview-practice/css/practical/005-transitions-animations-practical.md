# Practical: Slide-Out Drawer with GPU Animations

## Problem Title: High-Performance Slide-Out Navigation Drawer

## Difficulty: Medium / Senior

## Skills Tested
- GPU-accelerated CSS animations (`transform` and `opacity`)
- Layers management (`z-index` and Stacking Contexts)
- Preventing scroll chaining (`overscroll-behavior`)
- Layer promotion (`will-change`)

## Problem Statement
Implement a high-performance slide-out navigation drawer component (a sidebar drawer) with a backdrop overlay. The implementation must satisfy these performance and UX constraints:
1. **No Reflows**: The sidebar slide animation must not trigger layout recalculations. It must run on GPU-composited layers.
2. **Smooth Backdrop**: The backdrop overlay must transition its opacity smoothly from invisible to semi-transparent when the drawer opens.
3. **Scroll Prevention**: When the drawer is open and scrollable, scrolling inside it must not cause the underlying page content to scroll (prevent scroll chaining).
4. **Touch Safety**: The sidebar must reside on its own compositor layer to prevent paint delays during scrolling.

## Starter Code
```html
<!-- Drawer wrapper -->
<div class="drawer-container">
  <!-- Backdrop -->
  <div class="drawer-backdrop"></div>
  
  <!-- Sidebar -->
  <div class="drawer-sidebar">
    <div class="drawer-header">Menu</div>
    <div class="drawer-content">
      <!-- Scrollable content -->
      <p>Scrollable menu item 1</p>
      <p>Scrollable menu item 2</p>
    </div>
  </div>
</div>
```
```css
/* Implement hardware-accelerated drawer styling below */
.drawer-container {
}

.drawer-backdrop {
}

.drawer-sidebar {
}
```

## Requirements
- Use transforms (`transform: translateX()`) to slide the sidebar. Do not animate `left`, `right`, or `width` properties.
- Use `opacity` for the backdrop transition. Do not animate background colors with colors directly.
- Use `overscroll-behavior: contain` to prevent scroll chaining.

## Edge Cases
- **Varying Viewport Heights**: The drawer must take exactly `100%` height of the screen and scroll internally if the menu items exceed screen bounds.
- **Immediate Clicks**: Ensure backdrop click areas are disabled when the drawer is closed, preventing clicks from intercepting main page buttons.

## Expected Approach
Position both the backdrop and sidebar using `position: fixed`.
Slide the sidebar offscreen using `transform: translateX(-100%)`. Promote it using `will-change: transform`. When active (open), set `transform: translateX(0)`.
For the backdrop, set `opacity: 0` and toggle visibility using `pointer-events: none` when closed, and `pointer-events: auto` with `opacity: 0.5` when open.
Apply `overflow-y: auto` and `overscroll-behavior: contain` to the sidebar container to manage scrolls and lock background chaining.

## Solution
```css
/* 1. Root Container (Invisible when closed to prevent click blocks) */
.drawer-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  pointer-events: none; /* Let clicks pass through when closed */
  visibility: hidden;
  transition: visibility 0s linear 0.3s; /* Delay hidden till transition ends */
}

.drawer-container.open {
  pointer-events: auto;
  visibility: visible;
  transition-delay: 0s;
}

/* 2. Backdrop (Composited Opacity) */
.drawer-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000000;
  opacity: 0;
  transition: opacity 0.3s ease-out;
  will-change: opacity;
}

.drawer-container.open .drawer-backdrop {
  opacity: 0.4;
}

/* 3. Sidebar (Composited Transform & Scroll Lock) */
.drawer-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background-color: #ffffff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  
  /* Slide offscreen initially */
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  will-change: transform; /* Promote to GPU Layer */
}

.drawer-container.open .drawer-sidebar {
  transform: translateX(0);
}

.drawer-header {
  padding: 20px;
  font-size: 1.25rem;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}

/* 4. Internal Scroll Boundary */
.drawer-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  
  /* Scroll Prevention (Chaining lock) */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch; /* Smooth iOS momentum scrolls */
}
```

## Explanation
- **Composited Animations**: By animating only `transform` and `opacity`, the browser executes the animations on the GPU compositor thread. This keeps the main thread free and achieves a stable 60 FPS transition.
- **Visibility Delay**: When closed, we set `visibility: hidden` and `pointer-events: none` on `.drawer-container`. The transition-delay ensures that visibility is toggled only after the slide-out animation finishes.
- **Overscroll Behavior**: Applying `overscroll-behavior: contain` tells the browser's scroll engine to isolate scroll events within `.drawer-content`. When the user reaches the top or bottom scroll limits, scroll events are not forwarded to the parent window, preventing background scrolling.

## Time Complexity
- Layout rendering: handled on the GPU. Time complexity is $O(1)$ CPU operations.

## Space Complexity
- $O(1)$ layout rendering overhead.

## Interviewer Follow-ups
1. "What if the drawer should slide from the right side instead of the left?" (Change the initial state to `transform: translateX(100%)` and position it using `right: 0`).
2. "Why is `will-change: transform` added to the sidebar?" (It tells the browser's rendering engine to pre-allocate a GPU composition layer for the sidebar, preventing paint delays when the animation starts).

## Senior-Level Discussion
Slide-out drawers are standard interactive elements in web applications. To ensure smooth performance, avoid animating layout-triggering properties like `width` or `margin-left`.
Additionally, always manage interaction states (using `pointer-events: none` or `visibility: hidden`) when the drawer is closed, so that invisible layers do not block user clicks on the main page.
