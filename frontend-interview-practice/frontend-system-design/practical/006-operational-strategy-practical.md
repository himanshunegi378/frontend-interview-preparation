# Practical: Client Telemetry & Error Batcher

## Problem Title: Resilient Client-Side Error & Telemetry Batcher

## Difficulty: Senior

## Skills Tested
- Telemetry Event Queueing & Batching
- Native API fallbacks (`navigator.sendBeacon` vs `fetch`)
- Network Status Monitoring (`window.ononline`)
- Persistent LocalStorage Queue Recovery

## Problem Statement
In high-traffic applications, sending error and analytic events to the server on every single occurrence degrades client performance and floods the server. If the user goes offline, telemetry events are lost entirely.

Implement a `TelemetryBatcher` class that:
1.  Buffers events and flushes them to a server endpoint when the batch reaches a specific size (`maxBatchSize`) or after a set duration (`flushIntervalMs`).
2.  Uses `navigator.sendBeacon` for page unload flushes, falling back to `fetch` for standard active page batch flushes.
3.  Detects offline status. If offline, writes events to LocalStorage.
4.  Listens to the browser's `online` event to automatically reload and flush the offline LocalStorage queue when the connection is restored.

## Starter Code
```javascript
/**
 * Resilient, batched telemetry reporter.
 */
export class TelemetryBatcher {
  constructor(endpoint, options = {}) {
    this.endpoint = endpoint;
    this.maxBatchSize = options.maxBatchSize || 5;
    this.flushInterval = options.flushInterval || 3000;
    
    this.queue = [];
    this.timer = null;
    // Implement storage tracking and listeners
  }

  /**
   * Add a new log event to the queue.
   */
  log(event) {
    // Implement
  }

  /**
   * Trigger manual transmission of the active queue.
   */
  async flush() {
    // Implement
  }
}
```

## Requirements
- Each event logged must be enriched with a `timestamp: Date.now()`.
- Use a `setInterval` or `setTimeout` loop to automatically flush the queue. Clear this timer during flush actions to prevent overlapping cycles.
- When the page is about to unload (`beforeunload` / `pagehide`), flush the remaining queue immediately using `navigator.sendBeacon`.
- If the browser is offline (`navigator.onLine === false`) during a flush, merge the active queue into a LocalStorage key named `offline_telemetry` and empty the active queue.

## Edge Cases
- Calling `log()` while the browser is offline.
- Browser crash or sudden tab close (handled by saving to LocalStorage during unload).
- Duplicate event writes during online recovery synchronization.

## Expected Approach
We use an array `this.queue` for active memory buffering.
When `log(event)` is called:
1. Append `{ ...event, timestamp: Date.now() }` to `this.queue`.
2. If `this.queue.length >= this.maxBatchSize`, trigger `this.flush()`.
3. If no timer is active, start a countdown timer for `this.flushInterval`.

When `flush()` runs:
1. Clear the timer.
2. If `this.queue` is empty, exit.
3. If `navigator.onLine` is false:
   - Call `this._persistOffline(this.queue)`.
   - Clear `this.queue`.
   - Exit.
4. Execute `fetch(this.endpoint, { method: 'POST', body: JSON.stringify(this.queue) })`.
   - On success: clear `this.queue`.
   - On failure: persist the batch to LocalStorage and clear `this.queue`.

Listen to `window.addEventListener('online', () => this._syncOfflineQueue())`.
Inside `_syncOfflineQueue()`, read the `offline_telemetry` key from LocalStorage. If items exist, attempt to send them. On success, remove the key from LocalStorage.

## Solution
```javascript
export class TelemetryBatcher {
  constructor(endpoint, options = {}) {
    this.endpoint = endpoint;
    this.maxBatchSize = options.maxBatchSize || 5;
    this.flushInterval = options.flushInterval || 3000;
    this.storageKey = "offline_telemetry";

    this.queue = [];
    this.timerId = null;

    // Bind event listeners
    this._initListeners();
  }

  _initListeners() {
    // Listen to network recovery to flush offline queue
    window.addEventListener("online", () => this._syncOfflineQueue());

    // Listen to page unload to flush remaining queue via sendBeacon
    window.addEventListener("pagehide", () => this._flushUnload());
  }

  /**
   * Adds an event to the queue.
   */
  log(event) {
    const enrichedEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.queue.push(enrichedEvent);

    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timerId) {
      this.timerId = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Transmits the current queue to the server.
   */
  async flush() {
    this._clearTimer();
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = []; // Clear queue immediately to prevent duplicate sends

    if (!navigator.onLine) {
      console.warn("TelemetryBatcher: Client offline. Caching batch to LocalStorage.");
      this._persistOffline(batch);
      return;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
        keepalive: true // Keep request alive if page unmounts
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (err) {
      console.error("TelemetryBatcher: Flush failed. Storing batch offline.", err);
      this._persistOffline(batch);
    }
  }

  /**
   * Flush queue using navigator.sendBeacon during page unload.
   */
  _flushUnload() {
    this._clearTimer();
    if (this.queue.length === 0) return;

    const payload = JSON.stringify(this.queue);
    
    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.endpoint, payload);
      if (success) {
        this.queue = [];
        return;
      }
    }

    // Fallback if sendBeacon fails or is unsupported: persist offline
    this._persistOffline(this.queue);
    this.queue = [];
  }

  /**
   * Writes batch to LocalStorage.
   */
  _persistOffline(batch) {
    try {
      const existingRaw = localStorage.getItem(this.storageKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [...existing, ...batch];
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (err) {
      console.error("TelemetryBatcher: Failed to write to LocalStorage", err);
    }
  }

  /**
   * Reloads and sends cached offline logs.
   */
  async _syncOfflineQueue() {
    const offlineDataRaw = localStorage.getItem(this.storageKey);
    if (!offlineDataRaw) return;

    try {
      const offlineQueue = JSON.parse(offlineDataRaw);
      if (offlineQueue.length === 0) return;

      console.log(`TelemetryBatcher: Restored connection. Syncing ${offlineQueue.length} cached events...`);

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offlineQueue)
      });

      if (response.ok) {
        localStorage.removeItem(this.storageKey);
        console.log("TelemetryBatcher: Offline queue synced successfully.");
      }
    } catch (err) {
      console.error("TelemetryBatcher: Failed to sync offline queue", err);
    }
  }

  _clearTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
```

## Explanation
- **Automatic Sync Listener**: By listening to `window.ononline`, the batcher detects network restoration automatically, sending stored logs without requiring a page refresh.
- **Double Dispatch Fallback**: During active browsing, the batcher uses `fetch` with `keepalive: true` to support custom headers. During tab unmounts (`pagehide`), it switches to `navigator.sendBeacon` to ensure background delivery.
- **LocalStorage Buffer**: Storing unsent events locally guarantees telemetry preservation under unstable network conditions.

## Time Complexity
- **Logging Event**: $O(1)$ constant time.
- **Flushing Queue**: $O(1)$ constant time if online, or $O(E)$ where $E$ is the number of events to serialize to LocalStorage.

## Space Complexity
- **Memory Footprint**: $O(B)$ where $B$ is the `maxBatchSize` configuration.

---

## Interviewer Follow-ups
1. "Why list for `pagehide` instead of `unload` or `beforeunload`?"
   (Modern browsers deprecate `unload` because it prevents pages from entering the Back-Forward Cache (bfcache). `pagehide` is more reliable and compatible with page freezing lifecycles).
2. "How would you handle personal data (PII) like emails or passwords getting logged in error trace messages?"
   (Implement an event scrubber function `scrub(data)` that runs RegExp checks over message strings to mask credit card numbers, passwords, and tokens before appending them to the queue).

---

## Senior-Level Discussion
Developing custom telemetry drivers is necessary for optimizing performance in large SaaS systems.
By batching network transfers and providing offline queues, you protect backend databases from request storms while maintaining data integrity.
This demonstrates a deep understanding of browser networking lifecycles, memory tracking, and storage fallbacks.

---

### Extra Practice: API Type Guard Validation
**Task:** Implement a type-guard validation function that checks incoming API payloads against a contracted interface:
```javascript
export function isUserPayload(payload) {
  return (
    payload !== null &&
    typeof payload === "object" &&
    typeof payload.id === "number" &&
    typeof payload.name === "string"
  );
}
```
