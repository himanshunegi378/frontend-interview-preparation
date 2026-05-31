# Quiz: CSS Transitions, Animations, & GPU Performance

## Questions

### Question 1 (Medium - Pipeline Reflow Triggers)
Identify which of the following CSS properties, when animated, will trigger a **Layout** recalculation, which will trigger only **Paint**, and which will trigger only **Composite**.
- `width`
- `color`
- `transform`
- `opacity`
- `top`
- `background-image`

---

### Question 2 (Hard - Composition Layer Over-Promotion)
Explain what happens to memory consumption (VRAM) when the following CSS class is applied to a dynamically rendered list of 2,000 items on a mobile device.
```css
.list-item {
  will-change: transform, opacity;
  transition: transform 0.2s ease-out;
}
```

---

### Question 3 (Senior - Animating Height 0 to Auto)
Why does the following transition fail to animate, and how do you achieve a smooth toggle animation from `height: 0` to `height: auto` using pure CSS (without Javascript measurements)?
```css
.accordion-content {
  height: 0;
  transition: height 0.3s ease-out;
}

.accordion-content.open {
  height: auto;
}
```

---

## Answer Key & Explanations

### Question 1: Render Pipeline Phase Triggers
- **Difficulty:** Medium
- **Answer:**
  - **Layout (Reflow) + Paint + Composite**: `width`, `top`.
  - **Paint + Composite**: `color`, `background-image`.
  - **Composite Only**: `transform`, `opacity`.
- **Explanation:**
  - **Layout**: Modifying properties that affect geometries (like `width`, `top`, `margin`, `padding`) forces the browser to recalculate the positions of all elements on the page.
  - **Paint**: Modifying visual properties that do not affect layout geometries (like `color`, `background-image`, `box-shadow`) bypasses layout checks but forces the browser to repaint the pixels for that element.
  - **Composite**: Modifying properties that do not affect geometries or colors (like `transform` and `opacity`) allows the browser to bypass layout and paint checks entirely. It simply shifts the pre-rendered layer on the GPU, achieving smooth 60 FPS animations.
- **Common Mistakes:** Thinking that `top`/`left` properties are composited only because they are positioning properties. (Use `transform` instead).
- **Interviewer Follow-up:** "How does setting `will-change` affect these phases?" (It tells the browser to pre-allocate a GPU composition layer for that element, bypassing the initial layer creation steps during the animation).
- **Senior-Level Insight:** Always check CSS triggers before writing animations. Offloading animations to the composite thread keeps the main thread free for user interactions.

---

### Question 2: VRAM Depletion from Layer Promotion
- **Difficulty:** Hard
- **Answer:** It triggers VRAM (Video RAM) depletion, which can lead to layout lag, blurry rendering, or browser crashes on mobile devices.
- **Explanation:**
  - Setting `will-change: transform, opacity` forces the browser to create a separate GPU composition layer for every single `.list-item` element.
  - Each composition layer requires allocating a bitmap (image layer) stored in the GPU's Video RAM.
  - Allocating 2,000 layers on a mobile device with limited VRAM quickly exhausts available memory.
  - When VRAM is depleted, the browser may fallback to CPU rendering (dropping frame rates to 5-10 FPS), render elements with blurry textures to save memory, or crash the browser tab entirely.
- **Common Mistakes:** Assuming that adding `will-change` to all elements automatically improves performance.
- **Interviewer Follow-up:** "How do you optimize this list?" (Remove `will-change` from the list items. The browser can handle standard transform transitions dynamically on smaller groups of active layers, or promote items only during active touch/hover states).
- **Senior-Level Insight:** Manage GPU promotion carefully. Use `will-change` selectively on critical, frequently animated elements (like modal overlays or sidebar transitions), and remove it when the animation completes.

---

### Question 3: Height Transition Fallbacks
- **Difficulty:** Senior
- **Answer:** The transition fails because `auto` is a dynamic value calculated during the layout phase, and CSS transitions require interpolating between two absolute, numeric values.
- **Explanation:**
  - The browser cannot interpolate between `0` and a dynamic value like `auto` (since it does not know the final height until layout runs).
  - Consequently, the element immediately jumps to `auto` without transition.
  - **Pure CSS Solutions**:
    1. **Using `max-height`**: Transition to a large absolute value:
       ```css
       .accordion-content {
         max-height: 0;
         overflow: hidden;
         transition: max-height 0.3s ease-out;
       }
       .accordion-content.open {
         max-height: 500px; /* Must exceed actual content height */
       }
       ```
       *Downside:* If the content is much shorter than `500px`, the transition finishes early, resulting in a laggy closing animation.
    2. **Using CSS Grid Tracks**: Transition the grid row fraction:
       ```css
       .accordion {
         display: grid;
         grid-template-rows: 0fr;
         transition: grid-template-rows 0.3s ease-out;
       }
       .accordion.open {
         grid-template-rows: 1fr;
       }
       .accordion-content {
         overflow: hidden;
       }
       ```
       *Benefit:* Transitioning grid tracks resolves height-auto transitions cleanly, maintaining smooth animation speeds without requiring JavaScript measurements.
- **Common Mistakes:** Relying on `max-height` hacks with large values, which cause laggy animations.
- **Interviewer Follow-up:** "What are the limitations of the CSS Grid accordion solution?" (The content inside the grid item must be contained within a single child element that has `min-height: 0` or `overflow: hidden`).
- **Senior-Level Insight:** The CSS Grid `0fr ➔ 1fr` transition is a modern, clean solution for accordion animations, replacing complex JS height measurements and avoiding reflow issues.
