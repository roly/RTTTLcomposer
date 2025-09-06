// Minimal typing for react-dom/client's createRoot used in main.tsx

export function createRoot(container: Element | DocumentFragment): {
  render(children: any): void;
  unmount(): void;
};

