/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any;
  }
  interface Element extends any {}
}

declare module 'react' {
  export type ReactNode = any;
  export type FC<P = {}> = (props: P) => any;
  export function useState<T>(initialState: T | (() => T)): [T, (val: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly any[] | undefined): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useRef<T = unknown>(): { current: T | undefined };
  export const StrictMode: any;
  const React: any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export function createRoot(container: any): {
    render(children: any): void;
    unmount(): void;
  };
}
