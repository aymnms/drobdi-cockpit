import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    passWithNoTests: true,
    // Un changement sur ces fichiers « transverses » force la ré-exécution de
    // TOUTE la suite en mode `--changed` (CI), car il peut tout impacter.
    forceRerunTriggers: [
      "**/package.json/**",
      "**/{vitest,vite}.config.*",
      "**/tsconfig*.json",
      "**/esbuild.config.mjs",
    ],
    coverage: {
      provider: "v8",
      include: ["src/domain/**/*.ts"],
      reporter: ["text", "html"],
    },
  },
});
