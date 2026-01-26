import { existsSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import { loadConfig, resolveSlidesDirs } from "./config.js";
import { collectSlides } from "./collectSlides";

export interface DevServerInfo {
  name: string;
  port: number;
  process: any;
}

// Global tracking to prevent duplicate server starts
const runningServers = new Map<string, DevServerInfo>();

export async function startAllSlidesDevServer({
  basePort = 3001,
}: {
  basePort?: number;
} = {}): Promise<DevServerInfo[]> {
  const cwd = process.env.SLIDEV_WORKSPACE_CWD || process.cwd();
  const config = loadConfig(cwd);
  const slidesDirs = resolveSlidesDirs(config, cwd);

  let currentPort = basePort;
  const devServers: DevServerInfo[] = [];

  console.log("🚀 Starting Slidev dev servers for all slides...");
  console.log("📁 Working directory:", cwd);
  console.log("📂 Slides directories found:", slidesDirs);

  const slides = collectSlides({ slidesDirs, exclude: config.exclude });

  for (const { slideDir, slideName } of slides) {
    const packageJsonPath = join(slideDir, "package.json");

    // Create unique key for this slide (using absolute path)
    const slideKey = slideDir;

    // Check if this slide is already running
    if (runningServers.has(slideKey)) {
      console.log(`⏭️ ${slideName} dev server already running, skipping...`);
      devServers.push(runningServers.get(slideKey)!);
      continue;
    }

    if (!existsSync(packageJsonPath)) {
      console.warn(`⚠️ Skipping ${slideName}: no package.json found`);
      continue;
    }

    // Check if node_modules exists (dependencies installed)
    const nodeModulesPath = join(slideDir, "node_modules");
    if (!existsSync(nodeModulesPath)) {
      console.warn(
        `⚠️ Skipping ${slideName}: dependencies not installed (run pnpm install)`,
      );
      continue;
    }

    console.log(
      `📦 Starting Slidev dev server for ${slideName} on port ${currentPort}...`,
    );

    try {
      // Start slidev dev server with custom port
      const devProcess = spawn(
        "pnpm",
        ["run", "dev", "--port", currentPort.toString(), "--open", "false"],
        {
          cwd: slideDir,
          // Keep stdin open so Slidev's dev CLI (which listens for keyboard shortcuts)
          // doesn't exit immediately. The newer 52.10+ releases close when stdin is absent.
          stdio: ["pipe", "pipe", "pipe"],
          detached: false,
          env: {
            ...process.env,
            PATH: process.env.PATH,
          },
          shell: true,
        },
      );

      devProcess.stdout?.on("data", (data) => {
        const output = data.toString();
        if (output.includes("Local:") || output.includes("ready")) {
          console.log(
            `✅ ${slideName} dev server ready on port ${currentPort}`,
          );
        }
      });

      devProcess.stderr?.on("data", (data) => {
        console.error(`❌ ${slideName} dev server error:`, data.toString());
      });

      const serverInfo = {
        name: slideName,
        port: currentPort,
        process: devProcess,
      };

      devServers.push(serverInfo);
      runningServers.set(slideKey, serverInfo);

      currentPort++;
    } catch (error) {
      console.error(`❌ Failed to start dev server for ${slideName}:`, error);
    }
  }

  return devServers;
}

export function stopAllDevServers(devServers: DevServerInfo[]) {
  console.log("🛑 Shutting down all dev servers...");
  devServers.forEach(({ name, process }) => {
    console.log(`   Stopping ${name}...`);
    process.kill();
  });
  // Clear the running servers map
  runningServers.clear();
}
