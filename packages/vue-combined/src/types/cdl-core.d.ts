// Type declarations for @cdl/core
declare module '@cdl/core' {
  export function compile(source: string): {
    file: any;
    errors: Array<{ line: number; message: string }>;
  };
  
  export function render(
    cdlFile: any,
    theme?: string
  ): {
    success: boolean;
    option?: any;
    error?: string;
  };
}

// Vue SFC declarations
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}