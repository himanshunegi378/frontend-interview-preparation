# Quiz: Performance - Core Web Vitals (CWV)

## Questions

### Question 1 (Easy/Medium - LCP Hero Image Lazy Loading Trap)
A developer implements standard lazy-loading across all images on a landing page:
```html
<img src="/assets/hero-banner.jpg" loading="lazy" alt="Hero Banner" />
```
This image is the main above-the-fold banner (the Largest Contentful Paint node). How does adding `loading="lazy"` to this image impact the page's LCP score? What is the correct configuration?

---

### Question 2 (Medium/Hard - INP and Browser "Long Tasks")
While auditing a search page using Chrome DevTools, you notice several warning flags indicating **"Long Task"** executions (e.g., a callback took 95ms).
1.  What defines a "Long Task" in the browser event loop?
2.  How do Long Tasks directly degrade the page's Interaction to Next Paint (INP) score?
3.  What are the three main components of an INP delay?

---

### Question 3 (Senior - Font Loading and Cumulative Layout Shift)
An application loads a custom typography font from a third-party CDN. On slower networks, the page text renders immediately in Arial, and then "flashes" and shifts paragraphs down when the custom font finishes downloading.
Explain the browser styling mechanics (FOUT/FOIT) causing this Cumulative Layout Shift (CLS), and detail how to resolve it using modern CSS descriptors.

---

## Answer Key & Explanations

### Question 1: Above-the-Fold Lazy Loading Delay
- **Difficulty:** Easy/Medium
- **Answer:** 
  Applying `loading="lazy"` to an above-the-fold hero image severely **degrades** the LCP score by delaying when the browser begins downloading the image file.
- **Explanation:**
  - When the browser parses HTML, it uses a quick **Preload Scanner** to identify critical image URLs and start fetching them immediately.
  - However, if the scanner encounters `loading="lazy"`, it yields to the layout engine. The browser must wait to parse the HTML, build the DOM, run style/layout checks, and determine if the image is within the viewport before launching the download request.
  - This delay pushes the Largest Contentful Paint time back significantly, often adding 1 to 2 seconds to page load times.
- **Fix**:
  Remove `loading="lazy"` from hero images. Instead, preload the image and give it high fetch priority:
  ```html
  <link rel="preload" fetchpriority="high" as="image" href="/assets/hero-banner.jpg" />
  <img src="/assets/hero-banner.jpg" fetchpriority="high" alt="Hero Banner" />
  ```
- **Senior-Level Insight:** Lazy load images that are below-the-fold. Eagerly load and prioritize images inside the initial viewport to maximize LCP scores.

---

### Question 2: Browser Event Loop Blocking and INP Lifecycle
- **Difficulty:** Medium/Hard
- **Answer:** 
  1.  A **Long Task** is any JavaScript execution block that runs on the browser's main thread for **longer than 50 milliseconds**.
  2.  Long Tasks block the single-threaded event loop. If a user clicks or types while a long task is executing, the browser cannot handle the interaction, delaying the paint cycle and degrading the INP score.
  3.  The three components of INP are:
      *   **Input Delay**: The time waiting for the main thread to become idle (blocked by pending Long Tasks).
      *   **Processing Time**: The time spent executing the event listener's JavaScript code.
      *   **Presentation Delay**: The time spent by the browser recalculating styles, running layout passes, and painting the new frame.
- **Explanation:**
  - The browser's main thread operates on a message queue loop.
  - If a task takes 100ms, the main thread cannot parse any other events in the queue.
  - An interaction that occurs at millisecond 10 of this task must wait 90ms just for the thread to become available.
- **Senior-Level Insight:** To keep INP under 200ms, keep JavaScript tasks under 50ms. Use task division techniques (like yielding to the browser via `setTimeout` or `scheduler.yield()`) to break heavy operations into smaller execution blocks.

---

### Question 3: Font Style Flash (FOUT) & Metric Adjustments
- **Difficulty:** Senior
- **Answer:** 
  The layout shift is caused by **FOUT (Flash of Unstyled Text)**. When the custom font loads, the browser swaps fonts. Because Arial and the custom font have different character widths, letter-spacing, and line-heights, the text wrapping calculations change, shifting elements below the text.
- **Explanation:**
  - Browsers use the `font-display: swap` directive to prevent invisible text (FOIT) on startup. While fast, swapping Arial for a different font changes character dimensions.
  - If a paragraph wraps into 4 lines instead of 3, it pushes the entire page layout down, causing a layout shift.
- **Fixes**:
  1.  **Font Preloading**: Preload critical font files from the same origin to ensure they are available before rendering.
  2.  **Font Metric Overrides**: Use CSS `@font-face` descriptors (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) to match the fallback font's (Arial) layout dimensions to the custom font's geometry.
      ```css
      @font-face {
        font-family: 'FallbackFont';
        src: local('Arial');
        size-adjust: 92%; /* Scale down Arial to match custom font */
        ascent-override: 85%;
      }
      ```
  - This ensures that when the font swap occurs, the characters occupy the exact same physical space, yielding a CLS score of 0.
- **Senior-Level Insight:** Modern web frameworks (like Next.js Font Optimization) calculate font metric overrides automatically, but understanding these descriptors is essential when writing custom CSS.
