# Practical: Virtual DOM Diffing Engine

## Problem Title: Custom Virtual DOM Diff and Commit Engine

## Difficulty: Senior

## Skills Tested
- Virtual DOM Tree Representation (VNodes)
- Recursive Tree Comparison (Diffing)
- DOM Node Creation and Replacement
- Patching and committing mutations

## Problem Statement
Implement a custom Virtual DOM diffing and patching engine. The engine must compare an old virtual node tree (`oldVNode`) with a new virtual node tree (`newVNode`) and apply the minimum necessary modifications to the actual DOM.

A virtual node (VNode) is represented as a plain JavaScript object:
```javascript
const vnode = {
  type: "div",          // Tag name (string) or component function
  props: { id: "app" }, // Attributes (Object)
  children: []          // Array of VNodes or text strings
};
```

You must implement two functions:
1. `createElement(vnode)`: Compares a VNode structure and creates a corresponding real DOM element.
2. `diffAndPatch(parentDOM, oldVNode, newVNode, index = 0)`: Compares the old and new VNodes, identifies changes, and patches the real DOM node at the specified index within `parentDOM`.

## Starter Code
```javascript
/**
 * Creates a real DOM node from a VNode representation.
 * @param {Object|string} vnode - The virtual node to render
 * @returns {Node} The corresponding real DOM element
 */
export function createElement(vnode) {
  // Implement
}

/**
 * Diffs old and new VNodes, applying patches to the parent DOM element.
 * @param {HTMLElement} parentDOM - The parent container element
 * @param {Object|string} oldVNode - The previous virtual node state
 * @param {Object|string} newVNode - The new virtual node state
 * @param {number} [index] - Position of the element within the parent DOM
 */
export function diffAndPatch(parentDOM, oldVNode, newVNode, index = 0) {
  // Implement
}
```

## Requirements
- Support simple text nodes as children (represented as strings).
- If the node type changes (e.g. `div` $\rightarrow$ `span`), replace the entire DOM node.
- If properties (props) change, update only the changed properties on the real DOM element.
- Recurse through children to apply updates. Handle cases where the new tree has more children (create nodes) or fewer children (remove nodes).

## Edge Cases
- **Missing Nodes**: If `newVNode` is undefined, remove the corresponding DOM node from `parentDOM`.
- **Property Additions & Deletions**: If a property exists on `oldVNode` but not on `newVNode`, remove it from the DOM element.

## Expected Approach
For `createElement`: If the VNode is a string, return a real DOM text node (`document.createTextNode`). Otherwise, create a standard DOM element (`document.createElement`), apply properties, and recursively append children.

For `diffAndPatch`:
- If `oldVNode` is missing, append the new element: `parentDOM.appendChild(createElement(newVNode))`.
- If `newVNode` is missing, remove the old element: `parentDOM.removeChild(parentDOM.childNodes[index])`.
- If either node is a string, compare them. If they are different text strings, replace the text node.
- If node types differ (e.g. different tags), replace the node with a new element: `parentDOM.replaceChild(createElement(newVNode), parentDOM.childNodes[index])`.
- If types match, update element properties (props) and recursively diff/patch all children.

## Solution
```javascript
export function createElement(vnode) {
  // 1. Handle text VNodes represented as strings
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }

  // 2. Create the element
  const el = document.createElement(vnode.type);

  // 3. Apply properties (props)
  if (vnode.props) {
    for (const [key, value] of Object.entries(vnode.props)) {
      el.setAttribute(key, value);
    }
  }

  // 4. Append children recursively
  if (vnode.children) {
    vnode.children.forEach((child) => {
      el.appendChild(createElement(child));
    });
  }

  return el;
}

export function diffAndPatch(parentDOM, oldVNode, newVNode, index = 0) {
  const domNode = parentDOM.childNodes[index];

  // Case 1: Node removed
  if (newVNode === undefined) {
    if (domNode) {
      parentDOM.removeChild(domNode);
    }
    return;
  }

  // Case 2: Node added
  if (oldVNode === undefined) {
    parentDOM.appendChild(createElement(newVNode));
    return;
  }

  // Case 3: Node replaced (type changed or text string changed)
  if (
    typeof oldVNode !== typeof newVNode ||
    (typeof oldVNode === "string" && oldVNode !== newVNode) ||
    oldVNode.type !== newVNode.type
  ) {
    parentDOM.replaceChild(createElement(newVNode), domNode);
    return;
  }

  // Case 4: Node type matches, diff properties and children
  if (typeof newVNode === "object") {
    // A. Diff and patch properties (props)
    const oldProps = oldVNode.props || {};
    const newProps = newVNode.props || {};

    // Remove properties that no longer exist
    for (const key of Object.keys(oldProps)) {
      if (!(key in newProps)) {
        domNode.removeAttribute(key);
      }
    }

    // Add or update properties
    for (const [key, value] of Object.entries(newProps)) {
      if (oldProps[key] !== value) {
        domNode.setAttribute(key, value);
      }
    }

    // B. Diff and patch children recursively
    const oldChildren = oldVNode.children || [];
    const newChildren = newVNode.children || [];
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
      diffAndPatch(domNode, oldChildren[i], newChildren[i], i);
    }
  }
}
```

## Explanation
- **Node Replacement**: If VNode types differ, we replace the entire DOM branch. Changing a `div` to a `span` destroys the existing DOM subtree and recreates it.
- **Batched Prop updates**: Property updates compare keys, removing missing ones with `removeAttribute` and updating changed ones with `setAttribute`.
- **Recursive Child reconciliation**: We loop up to `maxLength`, calling `diffAndPatch` recursively. If the new list is shorter, `newVNode` is `undefined`, triggering node deletion. If the new list is longer, `oldVNode` is `undefined`, appending the new node.

## Time Complexity
- $O(N)$ operations where $N$ is the total count of elements inside the virtual trees, comparing nodes recursively.

## Space Complexity
- $O(D)$ where $D$ is the depth of the Virtual DOM tree (recursion stack frames).

## Interviewer Follow-ups
1. "How does using keys improve this child diffing algorithm?" (Without keys, our simple algorithm reconciles children index-by-index. If an item is inserted at the front of a list, the algorithm sees every element as changed and runs full updates. Keys allow the engine to identify elements that have moved, re-ordering them instead of recreating them).
2. "Why does directly editing attributes inside the loop cause layout performance issues?" (If properties change elements geometries, it can trigger layout recalculations. In production, React batches these commits to run them all at once).

## Senior-Level Discussion
Diffing Virtual DOM trees is a key mechanism of modern declarative frameworks. By separating tree comparison (Render Phase) from DOM updates (Commit Phase), React optimizes updates and provides a clean declarative API.
For high-performance applications, minimize Virtual DOM depth and keep component trees flat to reduce the CPU overhead of diffing large trees.