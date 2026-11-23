declare module 'vite' {
  export function defineConfig(config: any): any;
  export type Plugin = any;
  export type UserConfig = any;
  export type HtmlTagDescriptor = any;
  export namespace ViteDevServer {
    export type ModuleNode = any;
  }
  export interface ModuleNode {
    [key: string]: any;
  }
}

declare module '@vitejs/plugin-react' {
  const plugin: any;
  export default plugin;
}

declare module '@tailwindcss/vite' {
  const plugin: any;
  export default plugin;
}

declare module 'node:fs' {
  export * from 'fs';
  const fs: any;
  export default fs;
}

declare module 'node:path' {
  export * from 'path';
  const path: any;
  export default path;
}

declare module 'fs' {
  export const existsSync: (path: any) => boolean;
  export const readFileSync: (path: any, options?: any) => any;
  export const readdirSync: (path: any, options?: any) => any[];
  export const statSync: (path: any) => any;
  const fs: any;
  export default fs;
}

declare module 'path' {
  export const resolve: (...paths: string[]) => string;
  export const join: (...paths: string[]) => string;
  export const dirname: (path: string) => string;
  export const extname: (path: string) => string;
  const path: any;
  export default path;
}

declare const __dirname: string;
declare const process: any;
declare const Buffer: any;
declare function queueMicrotask(callback: () => void): void;
