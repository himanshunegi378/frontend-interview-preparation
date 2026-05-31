# Practical: APIs & WebSockets Communication

## Problem Title: Resilient WebSocket Client with Backoff, Jitter, & Offline Queue

## Difficulty: Senior

## Skills Tested
- Browser WebSocket API event handling
- Exponential Backoff algorithm with random Jitter
- Offline message buffering (Queue data structures)
- Connection heartbeat (Ping-Pong) check for zombie connections

## Problem Statement
Native browser WebSockets are low-level connections. If the network drops, the socket closes and does not reconnect automatically. If the client tries to transmit messages while offline, the browser throws errors. Furthermore, if a connection becomes "half-open" (the OS thinks it is connected, but the physical link is dead), the socket remains silent without triggering close events.

Implement a wrapper class `RobustWebSocket` that wraps the native `WebSocket` API to provide:
1.  **Auto-Reconnection**: Reconnects on close or error using an **exponential backoff** algorithm:
    $$\text{Delay} = \min(\text{maxDelay}, \text{baseDelay} \times 2^{\text{attempt}}) \pm \text{Jitter}$$
2.  **Offline Buffering**: A `send(data)` method that transmits messages immediately if online, or buffers them in an array queue if offline. When the connection is restored, flush the buffered messages.
3.  **Active Heartbeat (Keep-Alive)**: Periodically sends a ping message (e.g. `"ping"`) to the server. If the server does not respond with a pong message within a timeout limit, terminate the socket and trigger reconnect.

## Starter Code
```javascript
/**
 * Managed, resilient WebSocket client.
 */
export class RobustWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.pingInterval = options.pingInterval || 10000;
    this.pongTimeout = options.pongTimeout || 5000;
    
    this.socket = null;
    this.queue = [];
    this.attempt = 0;
    // Implement internal timers and state flags
  }

  /**
   * Connect to the WebSocket server.
   */
  connect() {
    // Implement
  }

  /**
   * Sends data or queues it if the socket is offline.
   */
  send(data) {
    // Implement
  }

  /**
   * Closes connection and cleans up all active timers.
   */
  close() {
    // Implement
  }
}
```

## Requirements
- Maintain an accurate connection status: `CONNECTING`, `OPEN`, `CLOSING`, `CLOSED`.
- Do not let retry delays exceed `maxDelay`.
- Jitter should be random (e.g. $\pm 20\%$ of the current delay) to prevent "thundering herd" issues where many clients reconnect at the exact same millisecond.
- Clear all active ping/pong timers when the socket closes to prevent memory leaks.

## Edge Cases
- Calling `send` while the socket status is `CONNECTING` (must queue the message).
- Reconnection triggered by multiple duplicate errors (ensure only one active reconnect timer is running).
- Server sending custom messages that are not pongs (do not mistake them for pongs, and trigger the user's `onmessage` callback).

## Expected Approach
We maintain a state machine.
Inside `connect()`:
1. Instantiate the native `new WebSocket(this.url)`.
2. Bind `onopen`, `onclose`, `onerror`, and `onmessage`.
3. In `onopen`: reset the attempt counter, flush any messages in `this.queue`, and start the heartbeat loop.
4. In `onclose` and `onerror`: clear timers, increment the attempt counter, calculate the backoff delay with jitter, and call `setTimeout(() => this.connect(), delay)`.
5. Heartbeat logic: send `"ping"` at `pingInterval`. Start a timeout timer for `pongTimeout`. If the `onmessage` handler receives `"pong"`, clear the timeout timer. If the timeout fires before receiving a pong, call `this.socket.close()` to trigger reconnection.

## Solution
```javascript
export class RobustWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.pingInterval = options.pingInterval || 10000;
    this.pongTimeout = options.pongTimeout || 5000;
    
    this.socket = null;
    this.queue = [];
    this.attempt = 0;
    this.isClosedByUser = false;

    // Timer IDs
    this.pingTimer = null;
    this.pongTimer = null;
    this.reconnectTimer = null;

    // Event hooks
    this.onopen = options.onopen || null;
    this.onclose = options.onclose || null;
    this.onerror = options.onerror || null;
    this.onmessage = options.onmessage || null;
  }

  /**
   * Establish connection to the server.
   */
  connect() {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) return;

    this.isClosedByUser = false;
    this.socket = new WebSocket(this.url);

    this.socket.onopen = (event) => {
      this._handleOpen(event);
    };

    this.socket.onclose = (event) => {
      this._handleClose(event);
    };

    this.socket.onerror = (event) => {
      this._handleError(event);
    };

    this.socket.onmessage = (event) => {
      this._handleMessage(event);
    };
  }

  _handleOpen(event) {
    console.log("RobustWebSocket: Connected successfully");
    this.attempt = 0; // Reset reconnect attempts
    
    // Start heartbeat checks
    this._startHeartbeat();

    // Flush any buffered offline messages
    this._flushQueue();

    if (this.onopen) this.onopen(event);
  }

  _handleClose(event) {
    this._cleanupTimers();

    if (this.onclose) this.onclose(event);

    // Only reconnect if the connection was not closed by calling close() explicitly
    if (!this.isClosedByUser) {
      this._scheduleReconnect();
    }
  }

  _handleError(event) {
    if (this.onerror) this.onerror(event);
    // Standard behavior is that close follows error, but force close if it doesn't
    if (this.socket) {
      this.socket.close();
    }
  }

  _handleMessage(event) {
    // Intercept heartbeat pong messages
    if (event.data === "pong") {
      this._resetPongTimeout();
      return;
    }

    if (this.onmessage) this.onmessage(event);
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return; // Prevent duplicate timers

    // Calculate delay: baseDelay * 2^attempt
    let delay = this.baseDelay * Math.pow(2, this.attempt);
    delay = Math.min(delay, this.maxDelay);

    // Add +/- 20% random Jitter
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    const finalDelay = Math.max(0, delay + jitter);

    this.attempt++;
    console.log(`RobustWebSocket: Reconnecting in ${Math.round(finalDelay)}ms (Attempt ${this.attempt})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, finalDelay);
  }

  _startHeartbeat() {
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send("ping");
        this._startPongTimeout();
      }
    }, this.pingInterval);
  }

  _startPongTimeout() {
    this.pongTimer = setTimeout(() => {
      console.warn("RobustWebSocket: Pong timeout exceeded. Closing zombie connection...");
      if (this.socket) {
        this.socket.close(); // Triggers _handleClose and reconnect
      }
    }, this.pongTimeout);
  }

  _resetPongTimeout() {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  _flushQueue() {
    while (this.queue.length > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = this.queue.shift();
      this.socket.send(message);
    }
  }

  /**
   * Send data immediately or buffer it if offline.
   */
  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.log("RobustWebSocket: Socket offline. Buffering message:", data);
      this.queue.push(data);
    }
  }

  /**
   * Terminate the connection voluntarily.
   */
  close() {
    this.isClosedByUser = true;
    this._cleanupTimers();
    if (this.socket) {
      this.socket.close();
    }
  }

  _cleanupTimers() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this._resetPongTimeout();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
```

## Explanation
- **Thundering Herd Mitigation**: By adding a randomized Jitter component (`jitter = delay * 0.2 * ...`), we prevent thousands of clients from hammering the server at the exact same millisecond after a server crash recovery.
- **Heartbeat & Zombie Connection Detection**: Half-open connections are common on mobile devices. By sending a `"ping"` and closing the socket if a `"pong"` isn't received in time, the client detects connection loss quickly and reconnects.
- **Queue Buffer Pattern**: Outgoing calls are intercepted. If the socket status is not open, messages are buffered. Once connected, they are flushed, ensuring no user events are lost.

## Time Complexity
- **Send Operation**: $O(1)$ constant time.
- **Queue Flush**: $O(Q)$ where $Q$ is the number of queued messages.

## Space Complexity
- **Buffer Storage**: $O(Q)$ space required to hold string payloads in memory.

---

## Interviewer Follow-ups
1. "How would you handle buffer overflow if the client stays offline for days?"
   (Enforce a maximum queue length limit (e.g. 500 messages) and drop the oldest messages, or serialize the queue to IndexedDB for persistent storage).
2. "Why use raw heartbeats in JS if TCP already has keep-alive frames?"
   (TCP keep-alive is handled at the OS layer. A connection can be open at the OS network level, but the application server process might be hung or deadlocked. Application-level pings verify the server process is responsive).

---

## Senior-Level Discussion
Writing custom wrappers around low-level web protocols shows a solid understanding of connection engineering.
In high-frequency environments, raw WebSockets are unstable.
By encapsulating heartbeats, buffers, and backoff retries into a single module, you create a robust abstraction layer that handles flaky mobile networks gracefully and keeps the application state in sync.

---

### Extra Practice: Chunk File Uploader
**Task:** Implement a utility function `uploadFileInChunks(file, chunkSize)` that reads a file array buffer and mocks uploading blocks:
```javascript
export async function uploadFileInChunks(file, chunkSize = 1024 * 1024) {
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    await fetch("/api/upload", { method: "POST", body: chunk });
    offset += chunkSize;
  }
}
```
