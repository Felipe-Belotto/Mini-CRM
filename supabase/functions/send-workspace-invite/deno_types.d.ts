// Tipos Deno para Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): Record<string, string>;
  };
  version: {
    deno: string;
    v8: string;
    typescript: string;
  };
  build: {
    target: string;
    arch: string;
    os: string;
    vendor: string;
    env?: string;
  };
  customInspect: symbol;
  readTextFile(path: string | URL): Promise<string>;
  readTextFileSync(path: string | URL): string;
  writeTextFile(path: string | URL, data: string): Promise<void>;
  writeTextFileSync(path: string | URL, data: string): void;
  [key: string]: any;
};

declare global {
  const Deno: typeof Deno;
}

export {};
