// Local React type shim so VS Code can resolve `react`
// Remove this file and the tsconfig `paths` entry once `@types/react` is installed.

// Provide a global React namespace (for React.FC, React.MouseEvent, etc.)
declare namespace React {
  type Key = string | number;
  type ReactNode = any;

  interface Attributes { key?: Key | null }
  interface ClassAttributes<T> extends Attributes { ref?: any }

  type SetStateAction<S> = S | ((prev: S) => S);
  type Dispatch<A> = (value: A) => void;

  type MouseEvent<T = Element> = any;
  type ChangeEvent<T = Element> = { target: T & { value: any; checked?: boolean } } & any;

  function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  // Overloads to allow null and no-arg usage
  function useRef<T = undefined>(): { current: T | undefined };
  function useRef<T>(initialValue: T | null): { current: T | null };
  function useRef<T>(initialValue: T): { current: T };

  interface FC<P = {}> {
    (props: P & { children?: ReactNode }): any;
    displayName?: string;
  }

  // Minimal JSX support
  namespace JSX {
    interface IntrinsicAttributes extends Attributes {}
    interface IntrinsicClassAttributes<T> extends ClassAttributes<T> {}
    interface IntrinsicElements { [elemName: string]: any }
    type Element = any;
    interface ElementClass { render?: any }
    interface ElementAttributesProperty { props: any }
    interface ElementChildrenAttribute { children: any }
  }

  // Value for default import usage
  const React: {
    createElement: (...args: any[]) => any;
    Fragment: any;
  };
}

// Make the module export the React namespace (mimics @types/react)
declare module 'react' {
  export = React;
  export as namespace React;
}
