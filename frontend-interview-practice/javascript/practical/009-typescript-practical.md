# Practical: Type-Safe Nested Object Key Path Extractor

## Problem Title: Deep Object Key Path Extractor (`ObjectKeyPaths`)

## Difficulty: Senior

## Skills Tested
- Advanced TypeScript Generics
- Recursive type resolutions
- Template literal types in string unions
- Index signatures and key mapping filters

## Problem Statement
Implement a TypeScript type utility `ObjectKeyPaths<T>` that accepts an object type `T` and returns a union of all possible dot-notation string paths pointing to its properties, including deeply nested keys.

For example, given:
```typescript
interface UserProfile {
  user: {
    id: number;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  role: string;
}
```
The output of `ObjectKeyPaths<UserProfile>` should be:
```typescript
"role" | "user" | "user.id" | "user.profile" | "user.profile.firstName" | "user.profile.lastName"
```

## Starter Code
```typescript
/**
 * Resolves all dot-notation key paths within object T.
 */
export type ObjectKeyPaths<T extends Record<string, any>> = any; // Implement
```

## Requirements
- The utility must support infinite depths (nested objects).
- Avoid traversing non-object primitives (strings, numbers, booleans, dates, arrays) as objects (e.g. do not show keys like `"role.toString"` or `"user.id.toFixed"`).

## Edge Cases
- **Array properties**: If a property is an array (e.g. `items: string[]`), do not traverse its array prototype keys (like `.push` or `.length`).
- **Dates and functions**: Primitives like `Date` or functions must be treated as leaves (ends of the path tree).

## Expected Approach
Use recursive conditional type mappings. Extract keys of `T` using `keyof T & string`. For each key `K`, check if the value type `T[K]` extends a plain record type. If it does, return the key `K` unioned with the recursive path of `T[K]` joined by a dot: `` `${K}.${ObjectKeyPaths<T[K]>}` ``. Use type narrowing to exclude built-in non-plain objects (like `Date`, `Function`, `Array`) from recursion.

## Solution
```typescript
type IsLeaf<T> = T extends Date | RegExp | Array<any> | Function
  ? true
  : T extends object
  ? false
  : true;

export type ObjectKeyPaths<T extends Record<string, any>> = {
  [K in keyof T & string]: IsLeaf<T[K]> extends true
    ? K
    : K | `${K}.${ObjectKeyPaths<T[K]>}`;
}[keyof T & string];
```

## Explanation
- **IsLeaf Utility**: We classify built-in objects (Dates, RegExp, Arrays, Functions) alongside primitives as "leaves" (`IsLeaf<T> === true`). This prevents the type engine from traversing their helper methods or indices.
- **Mapped Property extraction**: We build an intermediate object type where each key is mapped to its path string. By accessing it using `[keyof T & string]`, we extract a union of all property path variations.
- **Recursive Template literals**: `` `${K}.${ObjectKeyPaths<T[K]>}` `` dynamically builds nested dot-notation chains.

## Time Complexity
- Resolved at compile time by the TypeScript compiler. Computational cost scales with the depth of the object tree.

## Space Complexity
- Resolved at compile time. Deep nesting may hit TypeScript's default recursion limits if depths exceed 50+ levels.

## Interviewer Follow-ups
1. "How do you enforce that the values retrieved from these paths are also type-safe?" (You can create a matching utility `GetPropertyValue<T, Path>` that traverses the object tree using string splitting recursion to return the type of the value at that path).
2. "How would you handle index signatures (e.g., `[key: string]: any`) in the input object?" (Index signatures can cause the output to resolve to `string` or throw errors; we should exclude them by filtering out generic strings from the `keyof` list).

## Senior-Level Discussion
Type-safe path utilities are common in form handling frameworks (like React Hook Form) and state managers. By ensuring that path strings match the underlying object models, we catch typo bugs at compilation time rather than runtime. However, deeply nested recursive types can slow down TypeScript compilation performance in large codebases. It is best practice to keep interfaces modular and use type caches when possible.
