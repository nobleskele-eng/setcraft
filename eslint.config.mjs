import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "SetCraft_Swim_Studio_Final_v11_Performance_Intelligence/**",
    "server.ts",
  ]),
  {
    // These React 19 advisory rules flag established hydration and local-storage
    // initialization patterns throughout the legacy studio as errors even when
    // they are intentionally bounded. Runtime correctness is covered by the
    // production build and browser validation; keep actionable rules enabled.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
