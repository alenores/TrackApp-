import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Los arma el build, no se escriben a mano.
    "public/sw.js",
    "public/workbox-*.js",
    "public/fallback-*.js",
    // El motor del mapa: se copia tal cual desde la librería, no es código nuestro.
    "public/motor-del-mapa/**",
  ]),
]);

export default eslintConfig;
