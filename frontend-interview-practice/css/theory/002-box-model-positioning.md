# CSS Box Model, Positioning, Stacking Contexts, & z-index

## Why It Matters
Senior frontend engineers must understand box modeling and visual positioning to build complex overlays, sticky widgets, and layouts. Issues like z-index battles, clipped content, and unexpected element sizes occur when developers do not understand how browsers calculate box dimensions and resolve stacking order.

---

## Core Concepts & Mental Models

### 1. The CSS Box Model
Every element in document rendering is represented as a rectangular box. Sizing is governed by `box-sizing`:
- `content-box` (W3C default): Sizing properties (`width`, `height`) apply only to the content area. Padding and border are added to the outer dimensions:
  $$\text{Rendered Width} = \text{width} + \text{padding-left} + \text{padding-right} + \text{border-left} + \text{border-right}$$
- `border-box`: Sizing properties apply to the border edge. Padding and border shrink the content area, maintaining the total dimensions:
  $$\text{Rendered Width} = \text{width} \quad (\text{content} = \text{width} - \text{padding} - \text{border})$$

```
CSS Box Model:
┌───────────────────────────────────────────┐
│ Margin                                    │
│  ┌─────────────────────────────────────┐  │
│  │ Border                              │  │
│  │  ┌───────────────────────────────┐  │  │
│  │  │ Padding                       │  │  │
│  │  │  ┌─────────────────────────┐  │  │  │
│  │  │  │ Content                 │  │  │  │
│  │  │  └─────────────────────────┘  │  │  │
│  │  └───────────────────────────────┘  │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

### 2. Positioning States
Positioning determines how elements are placed in the layout flow:
- `static` (default): Follows the normal document layout flow. Sizing offsets (`top`, `left`, `z-index`) are ignored.
- `relative`: Follows the normal document layout flow, but offsets shift the element relative to its original position without affecting surrounding elements.
- `absolute`: Removed from the normal document flow. Positioned relative to its nearest positioned ancestor (non-static) or the initial containing block.
- `fixed`: Removed from flow. Positioned relative to the viewport.
- `sticky`: Positioned relative to its scroll parent. Behaves as `relative` until the scroll threshold is met, at which point it pins and behaves like `fixed` within its parent container bounds.

### 3. Stacking Context & z-index Resolution
The **Stacking Context** is a three-dimensional layering model along the Z-axis. z-index values are only compared within the same stacking context. An element with a high z-index (e.g., `z-index: 9999`) will render behind an element with a low z-index if its parent container forms a lower stacking context.

#### Stacking Context Triggers:
A new stacking context is created by:
1. The root element (`<html>`).
2. An element with `position: absolute` or `relative` and a `z-index` other than `auto`.
3. An element with `position: fixed` or `sticky`.
4. Elements with `opacity` less than `1`.
5. Elements with `transform`, `filter`, `perspective`, or `clip-path` values other than `none`.
6. Flex or Grid items with `z-index` other than `auto`.
7. Elements with `will-change` pointing to properties that trigger stacking (like `transform` or `opacity`).

---

## Real-World Case Study / Examples

### 1. The Stacking Context Bug (Lost Modals)
A modal backdrop (`z-index: 100`) renders *behind* a sidebar (`z-index: 10`) because the modal resides inside a parent container that triggers a stacking context:

```html
<div class="sidebar" style="position: relative; z-index: 10;">...</div>
<div class="main-wrapper" style="opacity: 0.99; /* Creates a Stacking Context! */">
  <div class="modal" style="position: fixed; z-index: 100;">...</div>
</div>
```
**Fix:** Append modals, overlays, and tooltips directly to the `<body>` element (using React Portals) to bypass parent stacking contexts.

---

## Common Interview Traps

### 1. Sticky Scroll Container Clip
```css
.scroll-container {
  overflow: hidden; /* Clones scroll container */
}
.sticky-header {
  position: sticky;
  top: 0;
}
```
**Trap:** The sticky header fails to pin. For `position: sticky` to work, all ancestor containers must allow scrolling. Setting `overflow: hidden`, `auto`, or `scroll` on an ancestor element locks the scroll boundaries, preventing the header from pinning.

---

## Junior vs. Senior View

- **Junior View**: "z-index controls layering. If something is behind, I just increase the z-index to 99999."
- **Senior View**: "z-index is relative. Elements are layered according to their stacking context. Stacking contexts are triggered by positioning, opacity, transforms, and filters. Senior engineers manage stacking contexts by using React Portals for overlays, maintaining flat z-index hierarchies, and keeping scroll parents free of overflow properties that break sticky positioning."

---

## Related Interview Questions
1. "Explain why setting `transform: translate3d(0,0,0)` on a parent element affects the positioning of its absolute-positioned children."
2. "Why does `position: sticky` fail to pin inside a container that has `overflow: hidden`?"
3. "Detail the order of painting inside a single stacking context according to the W3C spec."
4. "How does the browser calculate margins when `margin: auto` is applied to a absolute-positioned element with defined offsets?"

---

## Display types & z-index stacking context
- **Display types**: `block`, `inline`, `inline-block`, `none`, `flex`, `grid`. Inline elements ignore top/bottom margins and heights.
- **z-index and Stacking Contexts**: z-index works only on positioned elements (`absolute`, `relative`, `fixed`, `sticky`) and flex/grid items. A new stacking context is created by properties like `opacity < 1`, `transform`, `filter`, and explicit `z-index`. Sibling elements cannot overlap outside their parent's stacking context bounds.
