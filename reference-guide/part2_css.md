# PART 2: CSS ARCHITECTURE, RENDERING PERF & DESIGN SYSTEMS

## Module 2.1: The Critical Rendering Path & Performance

### 1. The Critical Rendering Path (CRP) Lifecycle
The Critical Rendering Path represents the sequence of steps the browser undergoes to convert HTML, CSS, and JavaScript into active pixels on the screen.

```
[HTML] --> DOM Tree --+
                      |--> Render Tree --> Layout (Reflow) --> Paint --> Composite (GPU)
[CSS]  --> CSSOM Tree -+
```

#### Step 1: DOM (Document Object Model) Construction
The browser parses HTML byte streams into tokens, converts those tokens into nodes, and constructs the DOM tree. This is an incremental process; the browser can build the DOM while still receiving data from the network.

#### Step 2: CSSOM (CSS Object Model) Construction
Unlike DOM construction, CSSOM construction is **render-blocking** and not incremental. The browser must parse all CSS files and `<style>` blocks entirely before building the CSSOM. This prevents Flash of Unstyled Content (FOUC). The browser matches CSS selectors against DOM nodes from right-to-left (e.g., in `.card .title`, it matches all `.title` nodes first, then walks up to check if they are inside a `.card` wrapper).

#### Step 3: Render Tree Construction
The browser combines the DOM and CSSOM to create the Render Tree. The Render Tree only includes visible nodes required to render the page.
- Nodes with `display: none` are omitted from the Render Tree (along with their descendants).
- Nodes with `visibility: hidden` are included in the Render Tree because they still occupy layout space.

#### Step 4: Layout (Reflow)
The browser calculates the exact geometry (width, height, position) of each node in the Render Tree relative to the viewport. Layout calculations are recursive; changes to a parent node's dimensions trigger geometry recalculations of all sibling and child nodes.

#### Step 5: Paint (Rasterization)
The browser converts the Render Tree and geometry calculations into actual pixels. Painting involves drawing text, colors, borders, shadows, and images. It is executed in layers, similar to design software. In V8 and Chromium, this phase creates a list of "Paint Ops" (draw calls) that are passed to the compositor.

#### Step 6: Composite
By default, all elements are painted into a single layer on the main thread. When elements are promoted to individual compositor layers, the browser uploads these layers to the GPU. The GPU composites these layers onto the screen. This phase runs on a separate **Compositor Thread**, bypassing the main thread.
- **`will-change` property:** Tells the browser which properties will change in the future. The browser creates a separate compositor layer for that element in advance.
- **Caution:** Overusing `will-change` consumes massive GPU memory, leading to performance degradation (the "layer explosion" anti-pattern).

---

### 2. Layout Thrashing and Forced Synchronous Layouts (FSL)
A **Forced Synchronous Layout (FSL)** occurs when JavaScript writes a style change to the DOM (invalidating the layout) and then immediately reads a geometric property. To return the correct value, the browser must force a layout calculation synchronously on the main thread, halting JS execution.

If this read-write cycle repeats inside a loop, it causes **Layout Thrashing**, dropping the frame rate to single digits.

```
       +---------------------------------------------+
       |   Write style (e.g., element.style.width)   |
       +----------------------|----------------------+
                              v
       +---------------------------------------------+
       |   Read style (e.g., element.offsetHeight)   |  <-- FORCED REFLOW
       +----------------------|----------------------+
                              v
       +---------------------------------------------+
       |             Repeat inside loop              |  <-- LAYOUT THRASHING
       +---------------------------------------------+
```

#### Code Demonstration of Layout Thrashing
```typescript
// BAD: Triggers FSL and Layout Thrashing
function resizeCardsBad(cards: HTMLElement[]) {
  for (let i = 0; i < cards.length; i++) {
    // Read (involves layout check because previous iteration modified DOM)
    const currentWidth = cards[i].offsetWidth; 
    
    // Write (invalidates layout state)
    cards[i].style.height = `${currentWidth * 0.75}px`; 
  }
}
```

#### High-Performance Batching Fix
To prevent FSL, read all layout metrics first, then write all modifications. We can automate this using `requestAnimationFrame` (rAF) to batch reads and writes within the browser's native frame budget.

```typescript
// GOOD: Batched Reads and Writes
function resizeCardsGood(cards: HTMLElement[]) {
  const widths: number[] = [];

  // Phase 1: Batch all DOM Reads
  for (let i = 0; i < cards.length; i++) {
    widths.push(cards[i].offsetWidth);
  }

  // Phase 2: Batch all DOM Writes in the next frame
  requestAnimationFrame(() => {
    for (let i = 0; i < cards.length; i++) {
      cards[i].style.height = `${widths[i] * 0.75}px`;
    }
  });
}
```

---

## Module 2.2: Modern Layout Engines & Containment

### 1. Flexbox and Grid Layout Algorithms
Under the hood, modern browsers implement layout engines (such as Chromium’s **LayoutNG**) to evaluate Flexbox and Grid structures.

#### Flexbox Algorithm Steps
1. **Determine the Flex Container Line Length:** The engine calculates the available space along the main axis.
2. **Collect Flex Items:** It groups items into flex lines based on `flex-wrap`.
3. **Resolve Flexible Lengths (The Three-Pass System):**
   - **First Pass (Min/Max Constraints):** Evaluates the base dimensions using `flex-basis`.
   - **Second Pass (Distribute Positive Space):** Distributes space if the container is larger than the items (`flex-grow`).
   - **Third Pass (Resolve Shrinkage):** Calculates item sizes if the items exceed container dimensions (`flex-shrink` * `flex-basis`).
4. **Align Items:** Aligns items along the cross axis using `align-items` and `align-self`.

#### Grid Layout Track Sizing Algorithm
The CSS Grid algorithm calculates track sizes (rows and columns) in five phases:
1. **Initialize Track Sizes:** Base sizes are calculated based on explicit values or `minmax()`.
2. **Resolve Intrinsic Track Sizes:** Evaluates sizes based on maximum/minimum content requirements.
3. **Distribute Extra Space:** Allocates remaining container space to tracks containing `fr` (fractional) units.
4. **Evaluate Max-Content Constraints:** Extends tracks if necessary to prevent child content overflow.
5. **Position Items:** Resolves the final coordinate map of elements in the grid grid-area slots.

---

### 2. CSS Containment (`contain`)
The `contain` CSS property tells the browser that the element's subtree is independent of the rest of the page. This isolates layout, style, paint, and size computations, allowing the browser to recalculate only the isolated component instead of the entire document tree.

```css
.isolated-widget {
  contain: layout paint size;
}
```

#### Containment Keywords

1. **`contain: layout`**
   - Guarantees that the element's internal layout has no effect on external elements, and vice versa.
   - The browser skips layout calculations for this element's children when external styles change.
   - It acts as a formatting context boundary.

2. **`contain: paint`**
   - Guarantees that children of the element cannot display outside its bounds.
   - If the element is off-screen, the browser skips painting its entire subtree.
   - Creates a stacking context and a containing block for absolute/fixed positioned descendants.

3. **`contain: size`**
   - Declares that the element's size can be computed without checking its children.
   - The size of the element is calculated as if it had no contents (requires explicit `width`/`height` or `contain-intrinsic-size`).

4. **`contain: style`**
   - Prevents counter and quote increments in the subtree from affecting the rest of the document.

5. **`contain: content`**
   - A shorthand equivalent to `contain: layout paint`. Optimizes dynamic dashboard widgets.

6. **`contain: strict`**
   - A shorthand equivalent to `contain: layout paint size style`. Offers maximum rendering isolation.

---

### 3. Container Queries for Component-Driven Design
Container queries allow developers to style elements relative to the size of their parent container rather than the global viewport width.

#### Establishing a Query Container
To query a parent container, we must define it as a container context. This requires allocating either inline size layout bounds or full size layout bounds.

```css
.card-container {
  container-type: inline-size;
  container-name: cardWrapper;
}

/* Query based on container-width */
@container cardWrapper (min-width: 400px) {
  .card-inner {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1.5rem;
  }
}
```

---

## Module 2.3: Scalable Design Systems

### 1. Token-Driven Architecture
A robust design system compiles design tokens into CSS Custom Properties (CSS variables) to support dynamic runtime adjustments.

```css
:root {
  /* Core Brand Primitives */
  --color-primary-500: hcl(220, 85%, 57%);
  --color-primary-600: hcl(220, 85%, 47%);
  
  /* Semantic Tokens */
  --bg-primary: var(--color-primary-500);
  --text-main: #111827;
  
  /* Typography Scale */
  --font-scale-base: 1rem;
  --font-scale-lg: 1.25rem;
  
  /* Spacing Scale */
  --space-sm: 0.5rem;
  --space-md: 1rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: var(--color-primary-600);
    --text-main: #f9fafb;
  }
}
```

---

### 2. Runtime CSS Variables vs. Build-Time CSS-in-JS
Modern CSS architectures balance dynamic flexibility against runtime performance overhead.

| System Type | Styling Mechanism | Performance Impact | Dynamic Capabilities |
| :--- | :--- | :--- | :--- |
| **Runtime CSS Variables** | Native browser variables updated dynamically via Javascript (`element.style.setProperty`). | Extremely light. Triggers style recalculation but bypasses script-based CSS injection cycles. | High. Can update layout colors, theme changes, or coordinates in real-time. |
| **Build-Time CSS-in-JS** (Vanilla Extract) | Generates static CSS stylesheets during compilation. | Zero runtime JS overhead. CSS is cached by the browser and has the same performance profile as raw CSS files. | Low. Theme swapping must be handled via CSS variable classes or re-rendering. |
| **Runtime CSS-in-JS** (Styled-Components / Emotion) | Generates and injects `<style>` blocks into the DOM dynamically during JS runtime execution. | High CPU cost. Frequent dynamic inserts trigger style recalculations and layout passes on every render. | High. Fully supports dynamic style generation based on React component props. |

---

### 3. Fluid Typography Calculations
Fluid typography scales text size smoothly between viewport boundaries. We can implement this using the CSS `clamp()` function.

```css
:root {
  /* Fluid Typographic formula:
     clamp(MIN_SIZE, VAL_FORMULA, MAX_SIZE)
     Scales between 16px (at 320px viewport) and 24px (at 1200px viewport)
     Slope: (24 - 16) / (1200 - 320) = 8 / 880 = 0.00909 (0.909%)
     Intersection: 16px - (320 * 0.00909) = 13.09px => 0.818rem
  */
  --font-size-fluid-h1: clamp(1rem, 0.818rem + 0.909vw, 1.5rem);
}
```

---

### 4. Maintaining Sub-Millisecond Interaction to Next Paint (INP)
**Interaction to Next Paint (INP)** measures how long it takes for a page to render a visual frame after a user interaction (click, keypress, tap). To keep INP below the 200ms threshold (and ideally under 10ms for micro-interactions), we must protect the main thread.

```typescript
// INP OPTIMIZATION: Yielding to the browser compositor
export function handleLongComputation(data: any[]) {
  const batchSize = 100;
  let index = 0;

  function processBatch() {
    const end = Math.min(index + batchSize, data.length);
    for (let i = index; i < end; i++) {
      // Execute expensive calculations...
    }
    index = end;

    if (index < data.length) {
      // Yield to the main thread before processing the next batch
      // This allows the browser to handle user input and render updates
      setTimeout(processBatch, 0);
    }
  }

  processBatch();
}
```
