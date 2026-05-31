# Practical: Lazy-Loading Image Grid Container with Suspense Cache

## Problem Title: Suspense-Compatible Image Preloader and Lazy Gallery

## Difficulty: Senior

## Skills Tested
- Suspense-Compatible Cache Implementation (Promise Throwing)
- Dynamic Component Lazy Loading (`React.lazy`, `import()`)
- Async Image Resource Preloading
- Fallback & Error Boundary Integration

## Problem Statement
Standard image grids render `<img>` elements before the underlying image file is downloaded, causing layout shifts and partial image loading artifacts (top-to-bottom scanline loading).

Implement a high-performance, Suspense-compatible image cache and dynamic viewer. You must:
1. Create a cache wrapper `createImageResource(src)` that conforms to React's Suspense protocol (throws a promise if loading, returns the URL when loaded, or throws an error on failure).
2. Build an `<ImageGallery>` component that uses the cache to load images.
3. Code-split the `<ImageDetailsModal>` component so it is only loaded if the user clicks an image.
4. Set up the gallery wrapper with Suspense boundaries for loading states, and Error Boundaries for image load failures.

## Starter Code
```javascript
import React, { Suspense, useState } from "react";

/**
 * Creates a resource wrapper that conforms to React Suspense rules.
 */
export function createImageResource(src) {
  // Implement
}

/**
 * Renders an image ONLY when it is fully loaded in memory.
 */
export function SuspenseImage({ src, ...props }) {
  // Implement
}
```

## Requirements
- `createImageResource(src)` must return an object with a `read()` method.
  - If the image is not loaded, `read()` must initiate the load and throw a promise.
  - If the image is loaded, `read()` must return the `src` string.
  - If the image fails to load, `read()` must throw the loading error.
- Image preloading must use the browser's native `Image` constructor (`new Image()`) and listen to `onload` and `onerror`.
- The `ImageDetailsModal` must be loaded lazily using `React.lazy`.

## Edge Cases
- Duplicate calls to `read()` with the same `src` must reuse the existing promise/cache, rather than launching duplicate network requests.
- Handling flaky networks where image assets fail to load.
- Avoid memory leaks in the cache by not retaining references indefinitely.

## Expected Approach
We will build a simple in-memory cache map. For each unique source URL, we store a record containing the status (`pending`, `success`, `error`), the result (the URL string or the error object), and the active promise.
The `read()` method checks this record. If it doesn't exist, it creates a new promise that resolves when the image onload fires. It throws this promise. If the status is pending, it throws the promise again. If the status is success, it returns the URL. If the status is error, it throws the error.

For code splitting, we declare a dynamic import for `ImageDetailsModal` using `React.lazy`.

## Solution
```javascript
import React, { Suspense, useState } from "react";

// In-memory image resource cache
const imageCache = new Map();

/**
 * Creates a Suspense-compatible resource wrapper for image loading.
 */
export function createImageResource(src) {
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }

  let status = "pending";
  let result = null;

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      status = "success";
      result = src;
      resolve(src);
    };
    img.onerror = (err) => {
      status = "error";
      result = new Error(`Failed to load image: ${src}`);
      reject(result);
    };
  });

  const resource = {
    read() {
      if (status === "pending") {
        throw promise; // Throw promise to let Suspense catch it
      } else if (status === "error") {
        throw result;  // Throw error to let ErrorBoundary catch it
      } else if (status === "success") {
        return result;  // Return loaded source URL
      }
    }
  };

  imageCache.set(src, resource);
  return resource;
}

/**
 * Suspense-compatible Image component.
 */
export function SuspenseImage({ src, alt, ...props }) {
  const resource = createImageResource(src);
  const loadedSrc = resource.read(); // Will throw promise if loading

  return <img src={loadedSrc} alt={alt} {...props} />;
}

// Code split the details modal component
const ImageDetailsModal = React.lazy(() => import("./ImageDetailsModal"));

// Error Boundary for handling image failures
class ImageErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: "10px", border: "1px solid red" }}>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ImageGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="gallery-container">
      <h2>Suspense Image Gallery</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {images.map((src, index) => (
          <ImageErrorBoundary key={src}>
            <Suspense fallback={<div className="skeleton" style={{ width: "200px", height: "150px", background: "#eee" }}>Loading Image...</div>}>
              <div onClick={() => setSelectedImage(src)} style={{ cursor: "pointer" }}>
                <SuspenseImage src={src} alt={`Gallery item ${index}`} style={{ width: "100%", height: "auto" }} />
              </div>
            </Suspense>
          </ImageErrorBoundary>
        ))}
      </div>

      {selectedImage && (
        <Suspense fallback={<div>Loading Modal Chunks...</div>}>
          <ImageDetailsModal src={selectedImage} onClose={() => setSelectedImage(null)} />
        </Suspense>
      )}
    </div>
  );
}
```

*Note: For testing, the file `ImageDetailsModal.js` would look like:*
```javascript
// ImageDetailsModal.js
import React from "react";
export default function ImageDetailsModal({ src, onClose }) {
  return (
    <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-content" style={{ background: "white", padding: 20, margin: "100px auto", width: 500 }}>
        <h3>Image Preview</h3>
        <img src={src} style={{ width: "100%" }} />
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

## Explanation
- **Suspense Mechanism Integration**: The key function is `createImageResource`. It initiates image preloading asynchronously. When React attempts to render `<SuspenseImage>`, `read()` throws the pending promise. React suspends rendering and renders the loading skeleton. On resolve, React renders again, `read()` returns the URL, and the image renders instantly without flash.
- **Dynamic Imports**: React.lazy wraps `import("./ImageDetailsModal")`. Webpack or Vite will compile this into a separate file chunk, ensuring that code size for the modal doesn't impact initial page load times.
- **Cache Deduplication**: Storing resources inside `imageCache` Map ensures that multiple components loading the same image reuse the same request, avoiding duplicate network usage.

## Time Complexity
- **Cache Checks**: $O(1)$ constant time.
- **DOM Rendering**: $O(I)$ where $I$ is the number of images to render.

## Space Complexity
- **Caching**: $O(M)$ where $M$ is the number of unique image URLs cached in the map.

---

## Interviewer Follow-ups
1. "How would you evict items from the cache to prevent memory leaks in a gallery of thousands of images?"
   (Implement an LRU eviction policy or use a `WeakMap` if the URL references can be bound to component keys, or periodically clear/trim the map size).
2. "Why is throwing promises considered an implementation detail of Suspense rather than standard JS design?"
   (Throwing promises is an architectural mechanism that React uses internally to control fiber execution flow. Normally, exceptions represent errors; using them for control flow is a distinct feature of React's cooperative scheduler).

---

## Senior-Level Discussion
Developing custom Suspense integrations shows a deep comprehension of React's concurrency architecture.
By utilizing resource caching and throwing promises, we can coordinate multi-resource layouts (code, data, images) under centralized loading skeletons, improving cumulative layout shift scores (CLS) and providing a smoother user experience.
In production environments, this pattern is often managed under framework layers (like Next.js routing, or React Query's `suspense: true` mode), but building custom implementations from scratch proves you understand the underlying engine.

---

### Extra Practice: Lazy Loading & Code Splitting
**Task:** Create a dynamic importer function wrapper simulating React lazy loads with retry capabilities on network drops:
```javascript
import React, { lazy } from "react";
export function lazyRetry(componentImport) {
  return lazy(() => 
    componentImport().catch((error) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          componentImport().then(resolve, reject);
        }, 1000);
      });
    })
  );
}
```
