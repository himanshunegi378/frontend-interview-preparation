# Quiz: Browser Events & Event Delegation

## Questions

### Question 1 (Easy/Medium - target vs. currentTarget)
Consider the following HTML markup and script:
```html
<div id="wrapper">
  <button id="btn">
    <span id="label">Click Me</span>
  </button>
</div>

<script>
  document.getElementById("wrapper").addEventListener("click", function(event) {
    console.log("Target:", event.target.id);
    console.log("CurrentTarget:", event.currentTarget.id);
  });
</script>
```
What is printed to the console when the user clicks directly on the text "Click Me"?

---

### Question 2 (Medium - stopPropagation vs. stopImmediatePropagation)
Given the following event setup, what is logged to the console when the `#child` button is clicked?
```javascript
const child = document.querySelector("#child");
const parent = document.querySelector("#parent");

child.addEventListener("click", (e) => {
  console.log("Child Listener 1");
  e.stopPropagation();
});

child.addEventListener("click", (e) => {
  console.log("Child Listener 2");
});

parent.addEventListener("click", (e) => {
  console.log("Parent Listener");
});
```
How does the output change if `Child Listener 1` calls `e.stopImmediatePropagation()` instead of `e.stopPropagation()`?

---

### Question 3 (Senior - Delegating Non-Bubbling Events)
An interviewer asks you to build a form validation system that listens to focus changes across 100 input fields inside a form. They specify that you must use event delegation to attach only one listener to the `<form>` container. 

However, the standard browser `focus` and `blur` events do not bubble. How do you implement event delegation for these non-bubbling events? Detail two separate solutions.

---

## Answer Key & Explanations

### Question 1: Target Leaf vs. Listener Container
- **Difficulty:** Easy/Medium
- **Answer:** 
  `Target: label`
  `CurrentTarget: wrapper`
- **Explanation:**
  - `event.target` is the leaf-most DOM node that triggered the event. In this case, clicking the text "Click Me" registers on the `<span>` element with the id `"label"`.
  - `event.currentTarget` is the element that holds the active event listener. Since the event handler is registered on the div with the id `"wrapper"`, `currentTarget` always points to `"wrapper"`.
- **Common Mistakes:** Expecting `event.target` to refer to the `<button>` element because buttons are interactive elements.
- **Senior-Level Insight:** When writing event delegation logic, never assume `event.target` is the interactive element you want. Always use `event.target.closest('button')` to traverse up to the button wrapper from nested icons or labels.

---

### Question 2: Propagation Control vs. Listener Execution Control
- **Difficulty:** Medium
- **Answer:** 
  **With `stopPropagation()`**:
  `Child Listener 1`
  `Child Listener 2`
  *(Parent Listener is NOT called)*

  **With `stopImmediatePropagation()`**:
  `Child Listener 1`
  *(Child Listener 2 and Parent Listener are NOT called)*
- **Explanation:**
  - Both listeners on `child` execute because they are bound to the target element. `e.stopPropagation()` prevents the click event from bubbling up to `parent`, so `Parent Listener` is skipped.
  - If `Child Listener 1` calls `e.stopImmediatePropagation()`, it tells the browser to halt event processing immediately. The browser skips subsequent listeners on the *same* element (`Child Listener 2`) *and* stops bubbling up to parents (`Parent Listener`).
- **Common Mistakes:** Assuming `stopPropagation()` prevents other event listeners registered on the same element from running.
- **Senior-Level Insight:** Use `stopImmediatePropagation()` when building modal popovers or dropdowns where clicking an action button should trigger the handler, but immediately intercept and prevent default page-wide handlers from executing.

---

### Question 3: Capture Phase Delegation & Bubbling Alternatives
- **Difficulty:** Senior
- **Answer:** 
  You can delegate non-bubbling events using two approaches:
  1.  **Use the Capturing Phase**: Set the third argument of `addEventListener` (or the `capture` option) to `true`.
  2.  **Use Bubbling Alternatives**: Listen to `focusin` and `focusout` instead of `focus` and `blur`.
- **Explanation:**
  - **Capture Phase Delegation**: While `focus` does not bubble up from child to parent, it does **capture** down from parent to child. By registering the listener in the capturing phase on the parent form, we capture the focus event:
    ```javascript
    form.addEventListener("focus", (e) => {
      console.log("Input focused:", e.target);
    }, true); // Enable capture phase
    ```
  - **`focusin` / `focusout`**: These are alternative events introduced in modern browsers that behave exactly like `focus` and `blur`, except they bubble. You can delegate them using the standard bubble phase:
    ```javascript
    form.addEventListener("focusin", (e) => {
      console.log("Input focused:", e.target);
    }); // Default bubble phase
    ```
- **Common Mistakes:** Trying to force delegation on standard `focus` during the bubble phase, which fails because the event terminates at the target element.
- **Senior-Level Insight:** When writing UI libraries or integrations, prioritize `focusin`/`focusout` for standard delegation, but fall back to capture-phase listeners if you must ensure compatibility with older environments that do not support modern bubbling focus variants.
