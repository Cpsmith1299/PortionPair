import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  {
    // `reference/` is the read-only Vite prototype; `design/` is the locked
    // design package. Neither is built, and neither should be linted.
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'reference/**', 'design/**'],
  },
  ...coreWebVitals,
  ...typescript,
];

export default config;
