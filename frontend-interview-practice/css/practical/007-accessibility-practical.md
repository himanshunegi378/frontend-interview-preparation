# Practical: Keyboard Focus Trap

## Problem Title: DOM Keyboard Focus Trap Utility

## Difficulty: Senior

## Skills Tested
- DOM querying for focusable elements
- Keyboard event delegation and interception
- Dynamic focus management (`element.focus()`)
- Lifecycle cleanup and event removals (preventing leaks)

## Problem Statement
Implement a JavaScript function `createFocusTrap(container)` that traps keyboard focus within a specified DOM container. This is a critical utility for building accessible modal dialogs, drawers, and menus.

The returned focus trap controller object must expose:
1. `activate()`: Saves the currently focused element, moves focus to the first focusable element inside the container, and activates the keydown event listener.
2. `deactivate()`: Deactivates the keydown event listener and restores focus back to the previously active element.

## Starter Code
```javascript
/**
 * Creates a focus trap controller.
 * @param {HTMLElement} container - The DOM container to trap focus within
 */
export function createFocusTrap(container) {
  // Implement focus trap logic
  
  return {
    activate() {},
    deactivate() {}
  };
}
```

## Requirements
- The focusable selectors list must cover: links (`a[href]`), inputs, select dropdowns, textareas, buttons, and elements with positive/zero `tabindex` attributes. Disabled elements (like `<button disabled>`) must be excluded.
- When `activate()` is called, focus must move to the first focusable element inside the container.
- If the user presses `Tab` on the last focusable element, wrap focus back to the first. If `Shift-Tab` is pressed on the first element, wrap focus to the last.
- If the user presses the `Escape` key, automatically trigger `deactivate()`.

## Edge Cases
- **No focusable elements**: If the container has zero focusable elements, do not attempt focus transitions to prevent runtime errors.
- **Dynamic focus elements**: If focusable elements are added or removed dynamically (e.g. mounting options), the list of focusable elements should be recalculated on each Tab keydown event rather than cached statically.

## Expected Approach
Define a selector string matching all interactive, non-disabled DOM elements.
In `activate()`, record `document.activeElement` as `previousActiveElement`. Find all focusable elements inside the container and focus the first element.
Bind a `keydown` event listener. In the listener:
- If key is `Escape`, call `deactivate()`.
- If key is `Tab`, query the container for the latest list of focusable elements. If empty, return.
- Identify the index of `document.activeElement`. If `Shift` is pressed and index is 0, focus the last element and `preventDefault()`. If `Shift` is not pressed and index is at the end, focus the first element and `preventDefault()`.

## Solution
```javascript
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]'
].join(",");

export function createFocusTrap(container) {
  let previousActiveElement = null;
  let isActive = false;

  const getFocusableElements = () => {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => {
        // Exclude elements that are hidden or have height/width 0
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && el.tabIndex !== -1;
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      deactivate();
      return;
    }

    if (e.key !== "Tab") return;

    const focusables = getFocusableElements();
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const firstEl = focusables[0];
    const lastEl = focusables[focusables.length - 1];
    const activeEl = document.activeElement;

    if (e.shiftKey) {
      // Shift + Tab: Backwards navigation
      if (activeEl === firstEl || !container.contains(activeEl)) {
        lastEl.focus();
        e.preventDefault();
      }
    } else {
      // Tab: Forwards navigation
      if (activeEl === lastEl || !container.contains(activeEl)) {
        firstEl.focus();
        e.preventDefault();
      }
    }
  };

  const activate = () => {
    if (isActive) return;
    isActive = true;

    // 1. Record the previously active element to restore focus later
    previousActiveElement = document.activeElement;

    // 2. Bind keyboard listener
    container.addEventListener("keydown", handleKeyDown);

    // 3. Move focus to the first focusable element
    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
    }
  };

  const deactivate = () => {
    if (!isActive) return;
    isActive = false;

    // 1. Unbind event listener to prevent memory leaks
    container.removeEventListener("keydown", handleKeyDown);

    // 2. Restore focus
    if (previousActiveElement && typeof previousActiveElement.focus === "function") {
      previousActiveElement.focus();
    }

    previousActiveElement = null;
  };

  return {
    activate,
    deactivate
  };
}
```

## Explanation
- **Dynamic Recalculation**: Instead of caching focusable elements on initialization, `getFocusableElements` is called inside the `Tab` event handler. This handles dynamically rendered options (like modal lists) correctly.
- **Accessibility Checks**: We filter elements using `getBoundingClientRect()` to exclude hidden elements (`display: none` or size zero), preventing the focus loop from jumping to invisible inputs.
- **Memory Safety**: `removeEventListener` is called inside `deactivate()` to release memory, preventing memory leaks when the modal is unmounted.

## Time Complexity
- `activate` / `deactivate`: $O(1)$ operations.
- Keydown handling: $O(F)$ where $F$ is the number of focusable elements in the container, due to DOM querying and filtering.

## Space Complexity
- $O(F)$ space to temporarily hold the list of focusable elements.

## Interviewer Follow-ups
1. "What if the active focus slips out of the container (e.g. if the user clicks a background element or another script moves focus)?" (To prevent this, you can attach a listener to the `focusin` event on the `document` body. If focus moves to an element outside the container while the trap is active, redirect focus back to the container).
2. "Why does `el.tabIndex !== -1` filter out non-tabbable items?" (Elements with `tabindex="-1"` are programmatically focusable using JavaScript but are skipped during standard keyboard tab navigation).

## Senior-Level Discussion
Keyboard focus trapping is a fundamental requirement for WCAG compliance. Modals, drop-down menus, and dialogs must trap focus, handle Escape to close, and restore focus to the triggering element.
When implementing focus traps in React, consider using vetted libraries like React Focus Lock or built-in browser dialog APIs (`<dialog>`), which handle these mechanics natively.
