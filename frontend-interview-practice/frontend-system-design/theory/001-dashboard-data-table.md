# System Design: Real-Time Enterprise Dashboard & Data Table

## Problem Statement & Context
An enterprise client requires a real-time analytics dashboard displaying dynamic metrics (such as financial transactions or cloud server metrics) alongside a highly interactive data table containing up to 100,000 rows. The system receives up to 10,000 updates per minute via WebSockets/SSE. The user interface must support column sorting, filtering, row selection, widget dragging/resizing, and maintain smooth animations without UI thread lockup.

---

## 1. Requirements

### Functional Requirements
- **Real-Time Widgets**: 12 analytical widgets (charts, counter tiles, trend indicators) updating continuously.
- **Customizable Layout**: Drag-and-drop grid repositioning and widget resizing.
- **Data Table**: Columns with multi-sort, global search, column-level filter, multi-row selection, and Excel/CSV exporting.
- **State Serialization**: Save user layouts, custom columns, and filters across reloads.

### Non-Functional Requirements
- **Smooth Interaction (INP)**: Interaction to Next Paint must remain under 50ms.
- **Low Memory Profile**: Prevent memory leaks under high-volume streaming updates.
- **Offline Resiliency**: Cache dashboard frames and display warnings if connections drop.
- **Accessibility (a11y)**: Focus management on layouts and screen-reader announcements on live cells.

---

## 2. Clarifying Questions & Design Answers
1.  **Q: Do the data updates affect the table rows, the charts, or both?**
    *   *A:* Real-time updates primarily feed the charts and metric tiles. The data table displays transactional logs updating at a slower rate (e.g., 10-20 rows/sec).
2.  **Q: Should the grid layout changes persist on the client or server?**
    *   *A:* Persist on the client via LocalStorage first, and sync back to the server in the background (debounced).
3.  **Q: Are column computations (sorting/filtering) done client-side or server-side?**
    *   *A:* Client-side for the current view up to 10,000 rows. Beyond that, delegate to a server-side paginated API.

---

## 3. Architecture & Data Flow

### Component Hierarchy
```
DashboardContainer (Grid Orchestrator)
  ├── GridHeader (Controls, Presets, Export Trigger)
  ├── WidgetGrid (Responsive GridLayout)
  │     ├── MetricWidget (Sub-Tree, Localized Renders)
  │     └── ChartWidget (WebGL/Canvas Chart Engine)
  └── TableWidget (Virtualized Data Grid)
        ├── TableHeader (Search, Filter Bars)
        └── VirtualTableBody (Windowed Rows)
```

### State Architecture
Use a normalized, select-based state manager (e.g., Zustand) to decouple incoming streams from component re-renders:
*   **Normalized Stores**: Separate `metricsCache` (raw data), `layoutPreferences` (widget geometries), and `tableState` (filters, sorts).
*   **Selectors**: Components subscribe only to their specific slice (e.g., `useStore(state => state.metricsCache['cpu-widget'])`), bypassing parent re-renders.

```
Incoming Stream (WebSocket) ──> Batch Buffer (250ms) ──> Normalizer ──> Zustand Store ──> Component Selectors (Only target widgets render)
```

---

## 4. API & Data Contract Design
Real-time connections use SSE or WebSockets to stream delta updates instead of full payloads:

### Delta Update Schema (WebSocket Stream)
```json
{
  "type": "METRIC_UPDATE",
  "timestamp": 1717182900000,
  "payload": {
    "widgetId": "chart-cpu-use",
    "dataPoints": [
      { "timestamp": 1717182900000, "value": 74.2 }
    ]
  }
}
```

---

## 5. Key Engineering Operations

### High-Frequency Stream Batching
Instead of updating the React state store on every WebSocket frame (which triggers hundreds of render cycles per second), queue updates inside a simple in-memory array and flush them in batches using a throttle loop:

```javascript
class StreamBuffer {
  constructor(flushCallback, interval = 250) {
    this.buffer = [];
    this.callback = flushCallback;
    setInterval(() => this.flush(), interval);
  }
  add(data) {
    this.buffer.push(data);
  }
  flush() {
    if (this.buffer.length === 0) return;
    this.callback(this.buffer);
    this.buffer = [];
  }
}
```

### Data Table Virtualization
To render 100,000 rows, use a windowing calculation. Set the inner scroll container height to `totalRows * rowHeight`. Calculate `startIndex` and `endIndex` dynamically from `scrollTop`, and absolutely position only the visible rows to maintain a constant DOM node count.

---

## 6. Security, Accessibility, & Performance

### Security
*   **XSS Protection**: Escape HTML inside cell data renderers (use React's default text parsing or sanitize custom cells).
*   **Rate Limiting**: Enforce client-side connection throttling if tabs go to the background to prevent server overloading.

### Accessibility (a11y)
*   **Table Elements**: Use proper semantic markers: `role="grid"`, `role="row"`, `role="columnheader"`.
*   **Live Announcements**: Mark metric panels with `aria-live="polite"` so screen-readers announce critical alerts without interrupting input flows.

### Performance
*   **Avoid Layout Thrashing**: Ensure widget resize observers throttle DOM query measurements.
*   **Offload Rendering**: Use HTML5 `<canvas>` or WebGL charting engines (like Chart.js or ECharts) instead of SVG for high-frequency real-time updates.

---

## 7. Tradeoffs & Senior-Level Discussion

### Tradeoff: WebSockets vs. SSE
*   *WebSockets*: Bidirectional and full-duplex. However, they bypass HTTP routing, don't auto-reconnect, and require dedicated server resources.
*   *SSE*: Unidirectional and HTTP/2 native. They support multiplexing and auto-reconnection out of the box, which is perfect for dashboards where clients only consume updates.

### Senior-Level Talking Points
"When designing real-time dashboards, the primary bottleneck is React's Virtual DOM reconciliation cost during stream updates. By implementing an asynchronous batch buffer and selecting specific store nodes via Zustand, we isolate renders to specific widgets. Additionally, offloading chart renders from SVG elements to Canvas objects keeps rendering performance high on low-end devices."
