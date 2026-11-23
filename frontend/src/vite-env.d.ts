/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare namespace JSX {
  interface Element {
    [key: string]: any;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface IntrinsicAttributes {
    key?: string | number | null | undefined;
    children?: any;
  }
  interface ElementChildrenAttribute {
    children: {};
  }
}

declare module 'react' {
  export type ReactNode = any;
  export type ReactElement<P = any, T = any> = any;
  export type FC<P = {}> = (props: P) => any;
  export type FunctionComponent<P = {}> = FC<P>;
  export type ComponentType<P = {}> = FC<P>;

  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;

  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];

  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly any[] | undefined): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;

  export interface RefObject<T> {
    readonly current: T | null;
  }
  export interface MutableRefObject<T> {
    current: T;
  }
  export function useRef<T>(initialValue: T): MutableRefObject<T>;
  export function useRef<T>(initialValue: T | null): RefObject<T>;
  export function useRef<T = undefined>(): MutableRefObject<T | undefined>;

  export const StrictMode: any;
  export const Fragment: any;

  export namespace JSX {
    interface Element {
      [key: string]: any;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface IntrinsicAttributes {
      key?: string | number | null | undefined;
      children?: any;
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }

  const React: {
    StrictMode: any;
    Fragment: any;
    useState: typeof useState;
    useEffect: typeof useEffect;
    useMemo: typeof useMemo;
    useRef: typeof useRef;
    useCallback: typeof useCallback;
  };

  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
  export namespace JSX {
    interface Element {
      [key: string]: any;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface IntrinsicAttributes {
      key?: string | number | null | undefined;
      children?: any;
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

declare module 'react/jsx-dev-runtime' {
  export const jsxDEV: any;
  export const Fragment: any;
  export namespace JSX {
    interface Element {
      [key: string]: any;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface IntrinsicAttributes {
      key?: string | number | null | undefined;
      children?: any;
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

declare module 'react-dom/client' {
  export interface Root {
    render(children: any): void;
    unmount(): void;
  }
  export function createRoot(container: any): Root;
}
