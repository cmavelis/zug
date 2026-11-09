declare module '*.mdx' {
  import type { ComponentType, JSX } from 'react';
  const MDXComponent: ComponentType<any>;
  export default MDXComponent;
}
