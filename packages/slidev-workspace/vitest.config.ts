import Vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [Vue()],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/preview"),
      "slidev:content": path.resolve(
        __dirname,
        "src/preview/composables/__mocks__/slidev-content.ts",
      ),
      "slidev:config": path.resolve(
        __dirname,
        "src/preview/composables/__mocks__/slidev-config.ts",
      ),
    },
  },
});
