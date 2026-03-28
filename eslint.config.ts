import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["src/**/*.{ts,mts,cts}"] },
  tseslint.configs.recommended,
]);
