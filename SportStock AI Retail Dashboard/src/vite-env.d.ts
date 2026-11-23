/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any;
    }
    interface Element extends any {}
  }
}

declare module 'react' {
  export type ReactNode = any;
  export type ReactElement = any;
  export type FC<P = {}> = (props: P) => any;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[] | undefined): T;
  export function useRef<T>(initialValue: T | null): { current: T | null };
  export function useRef<T = undefined>(): { current: T | undefined };
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
