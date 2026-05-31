# Practical: Multi-Step Form Builder with Localized Validation

## Problem Title: High-Performance Multi-Step Form Coordinator

## Difficulty: Senior

## Skills Tested
- Component Composition & Slot Passing
- Form State Localisation
- Uncontrolled / Controlled Hybrid Pattern
- Render Optimization and Thread Yielding

## Problem Statement
In enterprise applications (such as onboarding flows or checkout processes), multi-step forms are common. A common performance defect is that typing in Step 3 re-renders the whole form shell, including the progress stepper, header bar, and hidden steps 1 and 2.

Implement a `FormCoordinator` component that:
1. Coordinates navigation (Next / Back) between arbitrary steps passed as child elements.
2. Manages the active step index.
3. Automatically aggregates the values from all form fields across steps on final submission.
4. Prevents the parent `FormCoordinator` (and other inactive steps) from re-rendering on every keystroke in the active step.
5. Only permits moving to the next step if the active step passes validation.

## Starter Code
```javascript
import React, { useState, useRef } from "react";

/**
 * High-performance container for multi-step forms.
 * It must coordinate active steps and extract form data on submit.
 */
export function FormCoordinator({ children, onSubmit }) {
  const [activeStep, setActiveStep] = useState(0);
  // Implement
}

/**
 * Wrapper for individual steps to facilitate validation.
 */
export function FormStep({ children, stepName, validate }) {
  // Implement
}
```

## Requirements
- The coordinator should accept an array of `FormStep` elements as its children.
- Active step state must reside in `FormCoordinator` to render the correct step component and toggle Navigation controls.
- Keystrokes in the active step's fields must *not* trigger re-renders in `FormCoordinator` or the parent layout shell.
- Validation should be triggered when clicking "Next". If `validate` returns false, block navigation.
- On final submission, collect values of all inputs and return them as a consolidated object.

## Edge Cases
- Dynamic input additions inside steps (e.g., adding a passenger in a flight form).
- Retaining entered data when a user navigates backwards to previous steps.
- Form submissions triggered via the "Enter" key on input fields.

## Expected Approach
To achieve high performance and prevent keystroke re-renders from bubbling to the coordinator, we use **uncontrolled inputs** inside each `FormStep` wrapped in a native HTML `<form>` element.
Each `FormStep` exposes a ref containing its current validation status and a method to retrieve its local form data.
The `FormCoordinator` switches between step panels. When navigating "Next", it queries the active step's native DOM elements, validates them, caches the values, and advances.

## Solution
```javascript
import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";

// FormStep wrapped in forwardRef to expose validation and retrieval methods
export const FormStep = forwardRef(({ children, validate }, ref) => {
  const formRef = useRef(null);

  useImperativeHandle(ref, () => ({
    isValid: () => {
      if (!validate) return true;
      const data = new FormData(formRef.current);
      const values = Object.fromEntries(data.entries());
      return validate(values);
    },
    getData: () => {
      const data = new FormData(formRef.current);
      return Object.fromEntries(data.entries());
    }
  }));

  // Render children inside a localized form element
  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
      {children}
    </form>
  );
});

FormStep.displayName = "FormStep";

export function FormCoordinator({ children, onSubmit }) {
  const [currentStep, setCurrentStep] = useState(0);
  const stepsDataRef = useRef({});
  const activeStepRef = useRef(null);
  
  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    // 1. Trigger validation of active step via ref handle
    if (activeStepRef.current && !activeStepRef.current.isValid()) {
      alert("Please fix form validation errors before moving forward.");
      return;
    }

    // 2. Extract and cache active step data
    if (activeStepRef.current) {
      const currentStepData = activeStepRef.current.getData();
      stepsDataRef.current = {
        ...stepsDataRef.current,
        ...currentStepData,
      };
    }

    // 3. Advance step or submit
    if (isLastStep) {
      onSubmit(stepsDataRef.current);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Cache current data before moving back
      if (activeStepRef.current) {
        const currentStepData = activeStepRef.current.getData();
        stepsDataRef.current = {
          ...stepsDataRef.current,
          ...currentStepData,
        };
      }
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Clone active step to inject the ref handle
  const activeStepElement = React.cloneElement(steps[currentStep], {
    ref: activeStepRef,
    // Pass back cached values as default values
    defaultValueMap: stepsDataRef.current
  });

  return (
    <div className="form-coordinator" style={{ border: "1px solid #ccc", padding: "20px" }}>
      <div className="stepper-indicator" style={{ marginBottom: "20px" }}>
        Step {currentStep + 1} of {totalSteps}
      </div>

      <div className="step-content">
        {activeStepElement}
      </div>

      <div className="step-actions" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        {currentStep > 0 && (
          <button type="button" onClick={handleBack}>
            Back
          </button>
        )}
        <button type="button" onClick={handleNext}>
          {isLastStep ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
}
```

## Explanation
- **Imperative Handle Pattern**: `FormStep` uses `useImperativeHandle` combined with `forwardRef` to expose an internal API to its parent. This API contains `isValid()` and `getData()` calls.
- **Uncontrolled Data Extraction**: Instead of syncing keystrokes into React state, `FormData` is queried imperatively when navigating. This completely eliminates re-renders of the coordinate container during typing.
- **Data Preservation**: In step transition hooks, data is aggregated into `stepsDataRef.current`. When a step is re-rendered, the default values are re-injected so user changes are not lost when navigating back and forth.

## Time Complexity
- **Element Switching**: $O(1)$ constant time.
- **Form Extraction**: $O(F)$ where $F$ is the count of form fields in the active step (DOM traversal to collect key-value entries).

## Space Complexity
- **Memory Consumption**: $O(F_{total})$ where $F_{total}$ is the sum of all form values stored in the `stepsDataRef` cache.

---

## Interviewer Follow-ups
1. "How would you handle async validation (e.g., checking if a username is taken on the server) before advancing?"
   (Modify `isValid` to return a Promise: `async isValid()`. The coordinator would await it: `const ok = await activeStepRef.current.isValid();`).
2. "What if we have third-party components (like rich text editors or date pickers) that don't output values to standard form elements?"
   (Create a hidden input element inside the component that mirrors the rich-text content, or register custom input getters with the imperative ref handler).

---

## Senior-Level Discussion
For large-scale forms, defaulting to uncontrolled inputs or field-level state containment is standard practice.
When building form-heavy applications, libraries like React Hook Form leverage refs under the hood to bypass React's standard re-rendering cycle, updating only target fields instead of re-rendering massive trees.
This design separates the concerns of visual navigation (handled declaratively via state in `FormCoordinator`) and form value extraction (handled imperatively via DOM queries and ref bindings), showing a mature understanding of web standards and React lifecycle design.

---

### Extra Practice: Large Form Input Performance
**Task:** Implement a React form component that updates child nodes using uncontrolled input loops to avoid parent re-renders:
```javascript
import React, { useRef } from "react";
export function UncontrolledForm() {
  const inputRef = useRef();
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submit value: ", inputRef.current.value);
  };
  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="" />
      <button type="submit">Submit</button>
    </form>
  );
}
```
