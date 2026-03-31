/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="jest" />

declare namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_ENABLE_OBSERVABILITY?: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
  
  declare var globalThis: any;
  declare function performance(): never;
  declare namespace performance {
    function now(): number;
  }