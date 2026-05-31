# Performance: Rendering & Assets Optimization

## Why It Matters
Rendering performance determines how smooth an application feels once loaded. Unoptimized image files, font flashes, and redundant React rendering chains cause layout reflows and block the main thread, leading to high Interaction to Next Paint (INP) scores and visual instability (CLS). A senior engineer must optimize asset delivery (images, fonts) and construct efficient UI rendering paths to ensure interfaces run fluidly.

---

## Core Concepts & Mental Models

### 1. Image Optimization Strategies
Images represent the majority of page bytes downloaded on the web.
*   **Next-Gen Formats**: Replace JPEG/PNG with **WebP** or **AVIF**. AVIF provides up to 50% better compression than JPEG at matching quality levels.
*   **Responsive Images (`srcset`)**: Don't serve a massive $3000 \times 2000$ image to a mobile device with a $375\text{px}$ width viewport. Use the `srcset` and `sizes` attributes to let the browser select the most appropriate image size:
    ```html
    <img src="small.webp" 
         srcset="small.webp 500w, medium.webp 1000w, large.webp 1500w" 
         sizes="(max-width: 600px) 480px, 800px" 
         alt="Responsive Product" />
    ```
*   **Art Direction (`<picture>`)**: Use the `<picture>` tag when you need to serve entirely different images or crops depending on device layout constraints:
    ```html
    <picture>
      <source media="(max-width: 799px)" srcset="square-crop.webp">
      <source media="(min-width: 800px)" srcset="wide-landscape.webp">
      <img src="wide-landscape.jpg" alt="Art directed image">
    </picture>
    ```

### 2. Font Optimization Pipeline
Fonts are render-blocking by default.
*   **Subsetting**: Strip unused characters (such as Cyrillic glyphs in an English-only portal) from the font file to reduce its size by up to 80%.
*   **Preloading**: Preload critical fonts to ensure they are parsed and ready before the browser completes parsing the main stylesheet:
    ```html
    <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
    ```
*   **`font-display: swap`**: Commands the browser to display fallback system typography instantly while the web font is loading, and swap them once loaded, preventing blank pages (FOIT).

### 3. React Rendering Cycles Optimization
*   **State Colocation**: Push state as close as possible to the components that consume it. If only a single input needs state, store state inside the input component rather than lifting it to the dashboard container shell, preventing page-wide re-renders.
*   **Children Propagation Isolation**: Passing static elements as children allows React to skip rendering them during parent state updates (due to reference identity stability).
*   **React.memo & Reference Guards**: Wrap components in `React.memo` only if they render frequently with identical props, and safeguard prop references using `useMemo` and `useCallback`.

---

## Real-World Case Study / Examples

### Optimizing a Heavy Product Listing Grid
A product listing grid containing 100 high-resolution images dragged down lighthouse scores (LCP > 5s, CLS > 0.25).

**Refactoring Action Plan**:
1.  **Sizing Boundaries**: Set explicit width/height dimensions on grid card image tags, reducing CLS to 0.
2.  **Lazy Loading**: Enforce native lazy loading (`loading="lazy"`) on all images below-the-fold. Only eager-load the first 4 visible grid items.
3.  **Modern Formats**: Convert original PNGs to WebP/AVIF using CDN image pipelines.
4.  **Virtualization**: Implement a virtual scroll container so only 10 active cards are rendered in the DOM, maintaining 60 FPS scrolling on mobile browsers.

---

## Common Interview Traps

### The "useCallback protects child render" Trap
*   **The Trap**: A developer wraps a callback in `useCallback` but passes it to a standard, non-memoized child component:
    ```javascript
    const onClick = useCallback(() => {}, []);
    return <StandardButton onClick={onClick} />;
    ```
*   **The Reality**: This does not prevent the child from re-rendering. If the parent component renders, `StandardButton` re-renders by default. `useCallback` only saves rendering time if the child is wrapped in `React.memo`.

---

## Junior vs. Senior View

*   **Junior View**: "Optimization means running compression scripts. Use `React.memo` on every component and wrap every function in `useCallback` to make React fast."
*   **Senior View**: "Minimize page load metrics by converting images to WebP/AVIF formats, defining responsive dimensions, and preloading critical web fonts. In React, optimize rendering by localizing state boundaries, using component composition slots to isolate renders, and applying memoization primitives strategically by measuring scripting costs first."

---

## Related Interview Questions
1. "Explain the differences between SVG, Canvas, and WebGL rendering models, and when to use each."
2. "How does the `content-visibility: auto` CSS property improve rendering performance on long articles?"
3. "How would you handle image fallback scenarios if a browser does not support the AVIF format?"
4. "Why is mutating React state directly a performance hazard?"

---

## Avoiding unnecessary re-renders & Virtualization
- **Avoiding re-renders**: Using React memoization components, context split strategies, and localized states to keep rendering cycles contained to parent leaves.
- **Virtualization**: Painting only viewport items in view, bypassing heavy DOM allocations on huge list feeds.
