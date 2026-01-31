import { resolve } from "node:path";
import { build, createServer } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

import { slidesPlugin } from "../vite/plugin-slides";
import { loadConfig } from "../scripts/config";
import { DEFAULT_PREVIEW_PORT, packageRoot } from "./constants";
import { buildSlides, copySlidesToOutputDir } from "./slides";

export function createViteConfig(
  previewPort = DEFAULT_PREVIEW_PORT,
  mode: "dev" | "build" = "build",
) {
  const workspaceCwd = process.env.SLIDEV_WORKSPACE_CWD || process.cwd();
  const config = loadConfig(workspaceCwd);
  const devServerBasePort = previewPort + 1;
  const base = mode === "dev" ? "/" : config.baseUrl;

  return {
    root: resolve(packageRoot, "src/preview"),
    base,
    plugins: [vue(), tailwindcss(), slidesPlugin({ devServerBasePort })],
    resolve: {
      alias: {
        "@": resolve(packageRoot, "src/preview"),
      },
    },
    define: {
      __SLIDEV_WORKSPACE_DEV_PORT_BASE__: devServerBasePort,
    },
    build: {
      outDir: resolve(workspaceCwd, config.outputDir),
    },
    server: {
      port: previewPort,
      open: true,
    },
  };
}

export async function runViteBuild(names?: string[]) {
  try {
    await buildSlides(names);

    console.log("📦 Building Slidev Workspace for production...");
    const config = createViteConfig(DEFAULT_PREVIEW_PORT, "build");
    await build(config);

    // Copy slides into the workspace output directory
    await copySlidesToOutputDir(names);

    console.log("✅ Build completed successfully!");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

export async function runVitePreview(previewPort?: number) {
  try {
    console.log("🚀 Starting Slidev Workspace development server...");

    // The slidesPlugin will automatically start all slides dev servers
    const config = createViteConfig(previewPort, "dev");
    const server = await createServer(config);
    await server.listen();
    server.printUrls();
  } catch (error) {
    console.error("❌ Development server failed:", error);
    process.exit(1);
  }
}
