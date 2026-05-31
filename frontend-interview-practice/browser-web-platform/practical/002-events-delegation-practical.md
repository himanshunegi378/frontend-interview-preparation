# Practical: Browser Event Delegation Engine

## Problem Title: Wildcard Event Delegator Coordinator

## Difficulty: Senior

## Skills Tested
- Browser Event Delegation Mechanics
- CSS selector query matching (`element.closest()`, `element.matches()`)
- Event Listener lifecycle & memory cleanup
- Event target resolution with nested elements

## Problem Statement
When constructing dynamic UI architectures (such as components inside single-page applications), we need a way to listen to events on parent containers while executing callbacks only when specific child elements are targeted.

Implement an `EventDelegator` class that:
1. Coordinates event listeners on a single host (parent) element.
2. Exposes an `on(eventType, childSelector, callback)` method. The callback must execute only when the event triggers on an element matching `childSelector` (or any child *inside* that matched element).
3. Ensures that for each event type (e.g. `click`, `mouseover`), only **one** event listener is ever bound to the host element.
4. Exposes an off method or return cleanup handle to safely remove individual delegates and clean up the root listener if no delegates remain.

## Starter Code
```javascript
/**
 * Managed Event Delegator to register clean delegation handlers.
 */
export class EventDelegator {
  constructor(hostElement) {
    this.host = hostElement;
    // Implement storage tracking
  }

  /**
   * Registers a delegation listener.
   * Returns a function to clean up / unbind the listener.
   */
  on(eventType, childSelector, callback) {
    // Implement
  }
}
```

## Requirements
- Click events on child elements (e.g. an `<i>` tag inside a button `<button class="btn">`) must match if the button matches the selector (`.btn`).
- The callback must receive the standard event object, but `event.delegateTarget` should be dynamically set to the matched element (the element matching the selector).
- Only bind one active event listener to the `host` DOM node per distinct `eventType`.

## Edge Cases
- Registering multiple handlers for the same event type and selector.
- Dynamically deleting child elements after they are clicked, which can cause matches to fail.
- Elements clicked outside the host container.

## Expected Approach
We will keep a map `this.listeners = new Map()`.
The key is `eventType` (e.g. `"click"`). The value is an array of delegate definitions: `{ selector, callback }`.
When `on` is called:
1. If the map doesn't contain the `eventType`, we register a single root event handler on `this.host` for that event type.
2. Push `{ selector, callback }` to the delegate array.
3. The root handler intercepts all bubbled events. It loops through the registered delegates for this event type.
4. For each delegate, it checks if `event.target` or any of its ancestors within `this.host` matches the selector using `event.target.closest(selector)`.
5. If a match is found, it sets `event.delegateTarget = matchedElement` and executes the callback.
6. The `on` method returns a cleanup function that removes the delegate from the array. If the delegate array for an event type becomes empty, it unbinds the root listener from `this.host` to prevent memory leaks.

## Solution
```javascript
export class EventDelegator {
  constructor(hostElement) {
    if (!hostElement) {
      throw new Error("EventDelegator: Host element must be defined");
    }
    this.host = hostElement;
    this.events = new Map(); // Map<eventType, Array<{ selector, callback }>>
    this.handlers = new Map(); // Map<eventType, RootListenerFunction>
  }

  /**
   * Register a delegation listener.
   * @param {string} eventType 
   * @param {string} childSelector 
   * @param {Function} callback 
   * @returns {Function} Cleanup function to unbind
   */
  on(eventType, childSelector, callback) {
    if (!this.events.has(eventType)) {
      this.events.set(eventType, []);
      this._bindRootListener(eventType);
    }

    const delegates = this.events.get(eventType);
    const delegateRecord = { selector: childSelector, callback };
    delegates.push(delegateRecord);

    // Return cleanup helper
    return () => {
      const activeDelegates = this.events.get(eventType);
      if (!activeDelegates) return;

      const idx = activeDelegates.indexOf(delegateRecord);
      if (idx !== -1) {
        activeDelegates.splice(idx, 1);
      }

      // If no delegates left for this event, unbind the root listener to free memory
      if (activeDelegates.length === 0) {
        this._unbindRootListener(eventType);
      }
    };
  }

  /**
   * Binds the single root event listener to the host element.
   */
  _bindRootListener(eventType) {
    const rootListener = (event) => {
      const delegates = this.events.get(eventType) || [];
      
      for (const { selector, callback } of delegates) {
        // Find if target or any ancestor matches selector, up to the host element boundary
        const matchedElement = event.target.closest(selector);
        
        // Ensure matched element is inside our host container
        if (matchedElement && this.host.contains(matchedElement)) {
          // Define delegateTarget on the event object
          Object.defineProperty(event, "delegateTarget", {
            value: matchedElement,
            configurable: true
          });
          
          callback(event);
        }
      }
    };

    this.handlers.set(eventType, rootListener);
    this.host.addEventListener(eventType, rootListener);
  }

  /**
   * Unbinds the root event listener from the host element.
   */
  _unbindRootListener(eventType) {
    const rootListener = this.handlers.get(eventType);
    if (rootListener) {
      this.host.removeEventListener(eventType, rootListener);
      this.handlers.delete(eventType);
      this.events.delete(eventType);
    }
  }
}
```

## Explanation
- **Root Event Consolidation**: No matter how many sub-rules are registered, only one callback runs per event type. This reduces the browser's event dispatcher overhead.
- **`closest()` Traversal**: Using `element.closest()` ensures that even if a user clicks nested text nodes or icon elements, the delegation engine matches the parent button or row successfully.
- **Dynamic Cleanup**: By unbinding the root listener when there are no more active delegates, we prevent memory leaks in single-page apps when views unmount.

## Time Complexity
- **Register Listener**: $O(1)$ constant time queue insertion.
- **Event Handling**: $O(D \times M)$ where $D$ is the depth of the event target tree (DOM hierarchy height) and $M$ is the count of registered delegation selectors for that event type.

## Space Complexity
- **Memory Footprint**: $O(D_{total})$ where $D_{total}$ is the count of active delegates stored in the cache map.

---

## Interviewer Follow-ups
1. "What happens if a callback stops event propagation? Does that affect other delegates inside this delegator?"
   (Calling `event.stopPropagation()` stops the event from bubbling up past the *host* container to parent DOM nodes, but other delegates inside this `EventDelegator` will still execute because they run synchronously inside the *same* root listener execution frame. To stop other delegates, you would need to implement a custom propagation cancellation check inside the loop).
2. "How would you handle event delegation for custom events that do not bubble?"
   (You must register the root listener with `useCapture = true` in the browser options so the parent intercepts them as they descend the tree).

---

## Senior-Level Discussion
Writing lightweight custom event orchestrators is essential for building modular web page architectures without framework dependencies.
By delegating to parent nodes, we drastically reduce memory usage (essential for performance on mobile devices with limited RAM) and make our component lifecycles much simpler.
This pattern isolates event management concerns from component generation steps, demonstrating a clean approach to system design.
