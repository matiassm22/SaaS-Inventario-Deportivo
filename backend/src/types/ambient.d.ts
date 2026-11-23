declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};

declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
  exit(code?: number): void;
};

declare const Buffer: any;

declare module 'dotenv' {
  export function config(options?: any): { error?: any; parsed?: Record<string, string> };
}

declare module 'cors' {
  const cors: any;
  export default cors;
}

declare module 'multer' {
  namespace multer {
    export interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: any;
    }
  }
  function multer(options?: any): any;
  namespace multer {
    export const memoryStorage: any;
    export const diskStorage: any;
  }
  export = multer;
}

declare module 'express' {
  function express(): any;
  namespace express {
    export type Request = any;
    export type Response = any;
    export type NextFunction = any;
    export type RequestHandler = any;
    export type Router = any;
    export type Application = any;
    export const Router: any;
    export const json: any;
    export const urlencoded: any;
  }
  export = express;
}

declare module '@supabase/supabase-js' {
  export interface SupabaseClient {
    from(table: string): any;
    rpc(fn: string, params?: any): any;
    [key: string]: any;
  }
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): SupabaseClient;
}

declare module 'zod' {
  export type infer<T> = any;
  export namespace z {
    export type infer<T> = any;
  }
  export const z: any;
  export default z;
}
