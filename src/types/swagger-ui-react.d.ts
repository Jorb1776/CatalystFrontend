// src/types/swagger-ui-react.d.ts
declare module 'swagger-ui-react' {
  import * as React from 'react';

  export interface SwaggerUIProps {
    url?: string;
    spec?: object;
    layout?: string;
    plugins?: any[];
    presets?: any[];
  }

  const SwaggerUI: React.ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}

// CRITICAL: Makes this file a module
export {};