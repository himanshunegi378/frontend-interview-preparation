# Practical: Optimistic UI Updates in Next.js

## Problem Title: Optimistic List Updates with Server Actions

## Difficulty: Senior

## Skills Tested
- Next.js Server Actions (`"use server"`)
- React 18 `useOptimistic` Hook
- Form actions and loading transitions (`useTransition`)
- Hydration boundary safety

## Problem Statement
Build a comments list component that submits comments using Next.js Server Actions and updates the UI instantly using React's `useOptimistic` hook.

The component must meet these specifications:
1. **Instant Feedback**: When the user submits a new comment, display it in the list immediately with an "Adding..." indicator.
2. **Server Sync**: Trigger a mock server action `saveComment(text)` that resolves in 1.5 seconds.
3. **Success/Error handling**: If the action succeeds, lock the comment in the list and remove the "Adding..." indicator. If the action fails, remove the optimistic comment and display an error message.

## Starter Code
```javascript
import { useState, useOptimistic, startTransition } from "react";

// Mock Server Action (normally in actions.js)
export async function saveComment(text) {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (text.includes("error")) {
    throw new Error("Failed to save comment");
  }
  return { id: Date.now(), text, status: "saved" };
}

/**
 * Comments component.
 * @param {Object} props
 * @param {Array} props.initialComments - Initial comments loaded from Server Component
 */
export function CommentsList({ initialComments }) {
  // Implement component logic here

  return (
    <div>
      {/* Implement List and Form */}
    </div>
  );
}
```

## Requirements
- Use React's `useOptimistic` hook to manage the optimistic state.
- Keep the form inputs responsive while the action is running.
- Handle error boundaries to ensure that failed submissions do not break the list.

## Edge Cases
- **Empty input**: Prevent submissions if the text field is empty.
- **Multiple submissions**: If the user submits multiple comments rapidly, display all of them optimistically in the order they were submitted.

## Expected Approach
In `CommentsList`, initialize the optimistic state: `const [optimisticComments, addOptimisticComment] = useOptimistic(comments, (state, newComment) => [...state, newComment])`.
Handle the form submission inside a submit handler wrapper. Use `startTransition` to execute the update. Call `addOptimisticComment({ text, status: "sending" })` to update the list instantly.
Call the server action `saveComment(text)` inside the transition. Once it resolves, update the core React state `comments` with the saved comment. If it fails, capture the error and display an alert.

## Solution
```javascript
import { useState, useOptimistic, useTransition, useRef } from "react";

// Mock Server Action (Simulating Database delay)
export async function saveCommentAction(text) {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (text.trim().toLowerCase() === "error") {
    throw new Error("Database validation failed");
  }
  return { id: Date.now(), text, status: "saved" };
}

export function CommentsList({ initialComments = [] }) {
  const [comments, setComments] = useState(initialComments);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef(null);

  // 1. Initialize Optimistic State
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment) => [
      ...state,
      {
        id: newComment.id,
        text: newComment.text,
        status: newComment.status // 'sending' | 'saved'
      }
    ]
  );

  const handleFormSubmit = async (formData) => {
    const text = formData.get("comment");
    if (!text || !text.trim()) return;

    setErrorMsg(null);

    // Reset form inputs immediately
    if (formRef.current) {
      formRef.current.reset();
    }

    // 2. Trigger Optimistic Update inside Transition
    startTransition(async () => {
      const tempId = Date.now();
      addOptimisticComment({
        id: tempId,
        text: text,
        status: "sending"
      });

      try {
        // 3. Execute Server Action
        const saved = await saveCommentAction(text);
        
        // 4. Update core state on success
        setComments((prev) => [...prev, saved]);
      } catch (err) {
        // 5. Set error message on failure (triggers rollback automatically)
        setErrorMsg(err.message || "Failed to submit comment");
      }
    });
  };

  return (
    <div style={{ maxWidth: "400px", margin: "20px auto" }}>
      <h3>Comments</h3>

      {errorMsg && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {optimisticComments.map((comment) => (
          <li
            key={comment.id}
            style={{
              padding: "10px",
              borderBottom: "1px solid #eee",
              opacity: comment.status === "sending" ? 0.5 : 1
            }}
          >
            {comment.text}
            {comment.status === "sending" && (
              <span style={{ fontSize: "0.8rem", color: "#888", marginLeft: "10px" }}>
                (Adding...)
              </span>
            )}
          </li>
        ))}
      </ul>

      <form ref={formRef} action={handleFormSubmit} style={{ marginTop: "20px" }}>
        <input
          name="comment"
          type="text"
          placeholder="Write a comment... (type 'error' to fail)"
          disabled={isPending}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{ width: "100%", marginTop: "8px", padding: "8px" }}
        >
          {isPending ? "Submitting..." : "Submit Comment"}
        </button>
      </form>
    </div>
  );
}
```

## Explanation
- **useOptimistic Hook**: Takes the core `comments` state and a reducer function. When `addOptimisticComment` is called inside `startTransition`, React updates the list instantly. Once the async action finishes (or fails) and the transition ends, React discards the optimistic state and reverts to the core `comments` state.
- **Rollback on Error**: If `saveCommentAction` throws an error, the core state is not updated. Since the transition ends and React rolls back the optimistic state, the temporary comment is removed from the list automatically.
- **Form Actions**: By passing our handler directly to the form's `action` attribute, Next.js handles form submission natively, supporting progressive enhancement.

## Time Complexity
- Optimistic update: $O(1)$ insertions.
- Database write delay: simulated at 1.5 seconds.

## Space Complexity
- $O(O)$ where $O$ is the number of active optimistic comments stored in memory.

## Interviewer Follow-ups
1. "What happens to the form submission if JavaScript is disabled in the user's browser?" (Next.js Form Actions support progressive enhancement. If JS is disabled, the form submits using a standard POST request, running the Server Action on the server and reloading the page with updated comments).
2. "Why is `useTransition` required to run `useOptimistic` updates?" (`useOptimistic` updates must be marked as transitions so React can track their loading states and schedule rollbacks correctly).

## Senior-Level Discussion
Optimistic UI is critical for building responsive interfaces (like likes, comments, or settings toggles) where network delays can make the app feel slow.
Always ensure that optimistic updates can be rolled back cleanly on failure, and display descriptive error messages to help the user recover.

---

### Extra Practice: Optimistic Chat Updates
**Task:** Implement an optimistic message listing component that updates local UI instantly while loading server mutations:
```javascript
import React, { useOptimistic, startTransition } from "react";
export function OptimisticList({ initialMessages, sendMessageApi }) {
  const [optimisticMsgs, setOptimisticMsgs] = useOptimistic(
    initialMessages,
    (state, newMsg) => [...state, { text: newMsg, pending: true }]
  );
  const handleSend = async (formData) => {
    const text = formData.get("text");
    startTransition(() => {
      setOptimisticMsgs(text);
    });
    await sendMessageApi(text);
  };
  return (
    <div>
      {optimisticMsgs.map((m, i) => (
        <div key={i}>{m.text} {m.pending && "(sending...)"}</div>
      ))}
      <form action={handleSend}>
        <input name="text" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```
