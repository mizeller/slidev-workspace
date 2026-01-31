import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Walk upward to find the package root so dist/ builds still resolve src paths.
 */
function resolvePackageRoot(startDir: string) {
  let currentDir = startDir;

  for (let depth = 0; depth < 10; depth++) {
    if (existsSync(join(currentDir, "package.json"))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;

    currentDir = parentDir;
  }

  return startDir;
}

export const packageRoot = resolvePackageRoot(__dirname);
export const DEFAULT_PREVIEW_PORT = 3000;
