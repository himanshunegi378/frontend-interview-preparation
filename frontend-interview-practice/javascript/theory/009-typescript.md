# Advanced TypeScript: Generics, Mapped Types, & Conditional Types

## Why It Matters
Senior frontend engineers use advanced TypeScript to write type-safe, self-documenting codebases that scale. By creating flexible, dynamic type schemas, you can prevent runtime crashes, simplify API responses, and improve the developer experience (DX) through autocomplete features.

---

## Core Concepts & Mental Models

### 1. Generics as Type Functions
Generics (`<T>`) allow you to write reusable types that accept other types as arguments.
- **Constraints (`extends`)**: Limit the types a generic can accept. E.g., `<T extends object>` ensures `T` must be an object.
- **Defaults (`=`)**: Provide a default type if none is supplied. E.g., `<T = string>`.

### 2. Mapped Types (Type Iterators)
Mapped types build on index signatures to iterate through the keys of an existing type using `keyof`:
```typescript
type ReadOnlyMapped<T> = {
  readonly [K in keyof T]: T[K];
};
```
Modifiers like `+` or `-` add or remove flags:
- `-readonly`: Removes readonly flags.
- `?:`: Makes properties optional.
- `-?`: Removes optional flags (makes them required).

### 3. Conditional Types (Type Control Flow)
Conditional types act like ternary operators for types:
```typescript
type IsString<T> = T extends string ? true : false;
```
The `extends` keyword checks if the left-side type is assignable to the right-side type.

### 4. Type Inference with `infer`
The `infer` keyword inside a conditional `extends` statement declares a temporary type variable that the compiler infers automatically:
```typescript
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : any;
```
If `T` is a function, TypeScript infers its return type and binds it to `R`.

### 5. Discriminated Unions & Type Guards
- **Discriminated Union**: A pattern where objects in a union share a common literal key (e.g. `type: "success" | "error"`) used to safely narrow types.
- **User-Defined Type Guard**: A function with a return type predicate (e.g., `x is User`) that performs runtime checks to narrow types:
```typescript
function isUser(item: any): item is User {
  return item && typeof item.email === "string";
}
```

---

## Real-World Case Study / Examples

### 1. Dynamic API Client Typings
Using mapped and conditional types allows us to type-safe dynamic API route systems based on a single schema declaration:

```typescript
interface ApiSchema {
  "/users": { GET: { id: string }[]; POST: { name: string } };
  "/users/:id": { GET: { id: string; name: string }; DELETE: null };
}

type ApiResponse<Path extends keyof ApiSchema, Method extends keyof ApiSchema[Path]> = 
  ApiSchema[Path][Method];

// Usage:
// const userList: ApiResponse<"/users", "GET"> = [{ id: "1" }];
```

---

## Common Interview Traps

### 1. Any vs. Unknown
```typescript
let valueAny: any = "hello";
let valueUnknown: unknown = "hello";

valueAny.toUpperCase(); // Compiles (unsafe)
valueUnknown.toUpperCase(); // Error: Object is of type 'unknown'.
```
**Trap:** Using `any` disables type checking, leaving the code vulnerable to runtime crashes.
**Fix:** Use `unknown` to represent arbitrary values, forcing type checks or narrowing before use.

---

## Junior vs. Senior View

- **Junior View**: "TypeScript is just about writing types for variables, and `any` makes it easier to write code without errors."
- **Senior View**: "TypeScript is a Turing-complete type system. Senior engineers avoid `any` entirely, using generics, conditional types, and union narrowings to build self-documenting libraries, prevent regression bugs, and optimize IDE autocompletion for their teams."

---

## Related Interview Questions
1. "Explain the differences between `interface` and `type` declarations in TypeScript."
2. "How does the `infer` keyword work inside conditional types, and how do you use it to extract parameters from a function type?"
3. "What is the difference between `Record<string, unknown>` and `object` as typing definitions?"
4. "How do you configure template literal types to enforce string patterns (e.g., matching a hex color code `#HEX`)?"
