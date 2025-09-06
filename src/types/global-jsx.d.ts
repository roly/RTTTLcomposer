// Temporary JSX typing shim for editors when React types
// are not available (e.g., before `npm install`).
// This makes JSX elements type-check as `any` to remove noisy errors.
// Once @types/react is installed, React's JSX definitions will merge in
// and provide proper typings.

export {};

declare global {
  namespace JSX {
    // Allow any intrinsic element so JSX parses without errors.
    // This is intentionally loose and should be replaced by
    // React's @types once installed.
    interface IntrinsicElements {
      [elemName: string]: any;
    }

    // Keep `key` available on all elements
    interface IntrinsicAttributes {
      key?: any;
    }
  }
}

