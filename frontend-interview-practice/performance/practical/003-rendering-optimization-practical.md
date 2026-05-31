# Practical: Rendering & Assets Optimization

## Problem Title: Responsive Image Loader with Blur-Up Placeholder

## Difficulty: Senior

## Skills Tested
- Responsive Image API configurations (`srcset`, `sizes`)
- Dynamic Image Load Detection (`onload`, `onerror`)
- Progressive Enhancement & Blur-Up visual effects
- Aspect Ratio preservation for CLS protection

## Problem Statement
Standard `<img>` elements loaded without dimensions or placeholders cause Layout Shifts (CLS) when downloaded, and display ugly blank blocks while fetching.

Implement a React component `<OptimizedImage>` that:
1.  Accepts responsive image definitions (`src`, `srcset`, `sizes`, `aspectRatio`).
2.  Renders a low-resolution, blurred placeholder image immediately.
3.  Loads the high-resolution source image in the background.
4.  Smoothly transitions (fades in) the high-resolution image once fully loaded, while preserving layout geometry.

```javascript
// Usage Example:
<OptimizedImage
  src="hero-800.jpg"
  placeholderSrc="hero-blur-20.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w"
  sizes="(max-width: 600px) 400px, 800px"
  aspectRatio={16 / 9}
  alt="Hero Banner"
/>
```

## Starter Code
```javascript
import React, { useState, useEffect } from "react";

/**
 * High-performance image component with progressive blur loading.
 */
export function OptimizedImage({ src, placeholderSrc, srcset, sizes, aspectRatio, alt }) {
  // Implement component
}
```

## Requirements
- Enforce the container layout to respect `aspectRatio` (width / height) before the image loads.
- Render the blurred `placeholderSrc` stretched to cover the container.
- Animate the high-resolution image using CSS transitions: once loaded, fade it in (`opacity: 1`) over 300ms while keeping the blurred placeholder underneath.
- Handle fallback cases: if the high-resolution image fails to load, display a clean fallback placeholder or keep the placeholder visible without crashing the UI.

## Edge Cases
- Image loading cached from browser: if the image is already cached, bypass the transition animation and display it immediately to prevent unnecessary fade flashes.
- Dynamically changing the `src` prop (reset state and restart loading sequence).

## Expected Approach
We use a parent wrapper element styled with `position: relative`, `overflow: "hidden"`, and `aspectRatio: aspectRatio`.
Inside, we render two images absolutely positioned:
1.  **Placeholder Image**: Rendered with `filter: blur(10px)`, `transform: scale(1.1)` (to hide blurred edges), and `width: 100%`, `height: 100%`.
2.  **High-Res Image**: Rendered with `opacity: isLoaded ? 1 : 0`, `transition: opacity 0.3s ease`, and `width: 100%`, `height: 100%`.

We use a state variable `const [isLoaded, setIsLoaded] = useState(false)`.
We attach an `onLoad` handler to the high-res image: `onLoad={() => setIsLoaded(true)}`.
To detect if the image was already cached by the browser, check `complete` property on mount: `if (imgRef.current && imgRef.current.complete) setIsLoaded(true)`.

## Solution
```javascript
import React, { useState, useRef, useEffect } from "react";

/**
 * High-performance image component with progressive blur loading.
 */
export function OptimizedImage({ 
  src, 
  placeholderSrc, 
  srcset, 
  sizes, 
  aspectRatio = 16 / 9, 
  alt = "" 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const highResRef = useRef(null);

  // Check if image is already cached in browser memory on mount
  useEffect(() => {
    if (highResRef.current && highResRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div
      className="optimized-image-container"
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        aspectRatio: aspectRatio,
        backgroundColor: "#f0f0f0", // Neutral grey skeleton placeholder
      }}
    >
      {/* 1. Low-Res Blurred Placeholder */}
      {!hasError && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt={alt}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(20px)",
            transform: "scale(1.1)", // Hide blurry edge lines
            opacity: isLoaded ? 0 : 1,
            transition: "opacity 0.4s ease-out",
            pointerEvents: "none",
          }}
        />
      )}

      {/* 2. High-Res Image with fade-in transition */}
      {!hasError ? (
        <img
          ref={highResRef}
          src={src}
          srcSet={srcset}
          sizes={sizes}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        />
      ) : (
        // 3. Fallback UI on load failure
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            color: "#666",
            fontSize: "14px",
          }}
        >
          Failed to load image
        </div>
      )}
    </div>
  );
}
```

## Explanation
- **Preserving Layout (CLS prevention)**: Setting `aspectRatio` on the parent container ensures that space is allocated instantly before images load, keeping the Cumulative Layout Shift (CLS) score at 0.
- **Progressive Enhancement**: Renders the small blurred image (usually 10-20px wide, ~2KB) instantly. Fade in the high-res image only after it downloads, preventing a jagged scanline render experience.
- **Cache Acceleration**: Checking the image `.complete` property in a `useEffect` prevents flashing transitions if the image was already downloaded by the browser.

## Time Complexity
- **State Initialization**: $O(1)$ constant time.
- **CSS Transitions**: Handled by the browser's compositing thread, running at 60 FPS.

## Space Complexity
- **Memory Footprint**: $O(1)$ constant space.

---

## Interviewer Follow-ups
1. "How would you integrate this with lazy loading?"
   (Simply append `loading="lazy"` to the high-res image tag. Modern browsers will automatically delay loading it until the parent container approaches the viewport).
2. "Why use `aspect-ratio` in CSS instead of setting hardcoded width and height attributes?"
   (Hardcoded attributes are not responsive. `aspect-ratio` allows the container to span responsive grid systems while preserving width-to-height scaling geometry).

---

## Senior-Level Discussion
Developing custom asset coordinators is necessary for building polished enterprise frontends.
By wrapping image loadings in a double-layer layout, you eliminate layout shifts (CLS), improve visual responsiveness, and provide a polished user experience.
This demonstrates a solid understanding of browser layout behaviors, rendering lifecycles, and performance tuning.

---

### Extra Practice: Virtualized Sizing Layout
**Task:** Implement a viewport visibility checker that determines if an element is currently in screen limits:
```javascript
export function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
```
