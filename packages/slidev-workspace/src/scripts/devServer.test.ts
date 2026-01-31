import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EventEmitter } from "node:events";

const spawnMock = vi.hoisted(() => vi.fn());
const loadConfigMock = vi.hoisted(() => vi.fn());
const resolveSlidesDirsMock = vi.hoisted(() => vi.fn());
const collectSlidesMock = vi.hoisted(() => vi.fn());

vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return {
    ...actual,
    spawn: spawnMock,
    default: {
      ...actual,
      spawn: spawnMock,
    },
  };
});

vi.mock("./config.js", () => ({
  loadConfig: loadConfigMock,
  resolveSlidesDirs: resolveSlidesDirsMock,
}));

vi.mock("./collectSlides", () => ({
  collectSlides: collectSlidesMock,
}));

describe("scripts devServer", () => {
  let tempRoot: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempRoot = mkdtempSync(join(tmpdir(), "slidev-workspace-dev-"));
    process.env.SLIDEV_WORKSPACE_CWD = tempRoot;

    loadConfigMock.mockReturnValue({ exclude: [] });
    resolveSlidesDirsMock.mockReturnValue([join(tempRoot, "slides")]);

    spawnMock.mockImplementation(() => ({
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      kill: vi.fn(),
    }));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
    delete process.env.SLIDEV_WORKSPACE_CWD;
  });

  it("starts dev servers for valid slides", async () => {
    const slidesRoot = join(tempRoot, "slides");
    const alphaDir = join(slidesRoot, "alpha");
    const betaDir = join(slidesRoot, "beta");

    mkdirSync(join(alphaDir, "node_modules"), { recursive: true });
    mkdirSync(join(betaDir, "node_modules"), { recursive: true });
    writeFileSync(join(alphaDir, "package.json"), "{}");
    writeFileSync(join(betaDir, "package.json"), "{}");

    collectSlidesMock.mockReturnValue([
      { slideDir: alphaDir, slideName: "alpha", slidesDir: slidesRoot },
      { slideDir: betaDir, slideName: "beta", slidesDir: slidesRoot },
    ]);

    const { startAllSlidesDevServer, stopAllDevServers } = await import(
      "./devServer"
    );

    const servers = await startAllSlidesDevServer({ basePort: 4000 });

    expect(servers.map((server) => server.port)).toEqual([4000, 4001]);
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(spawnMock).toHaveBeenNthCalledWith(
      1,
      "pnpm",
      ["run", "dev", "--port", "4000", "--open", "false"],
      expect.objectContaining({
        cwd: alphaDir,
        shell: true,
        stdio: ["pipe", "pipe", "pipe"],
      }),
    );
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["run", "dev", "--port", "4001", "--open", "false"],
      expect.objectContaining({
        cwd: betaDir,
        shell: true,
        stdio: ["pipe", "pipe", "pipe"],
      }),
    );

    stopAllDevServers(servers);
  });

  it("skips slides without package.json or node_modules", async () => {
    const slidesRoot = join(tempRoot, "slides");
    const missingPackageDir = join(slidesRoot, "missing-package");
    const missingModulesDir = join(slidesRoot, "missing-modules");

    mkdirSync(missingPackageDir, { recursive: true });
    mkdirSync(missingModulesDir, { recursive: true });
    writeFileSync(join(missingModulesDir, "package.json"), "{}");

    collectSlidesMock.mockReturnValue([
      {
        slideDir: missingPackageDir,
        slideName: "missing-package",
        slidesDir: slidesRoot,
      },
      {
        slideDir: missingModulesDir,
        slideName: "missing-modules",
        slidesDir: slidesRoot,
      },
    ]);

    const { startAllSlidesDevServer, stopAllDevServers } = await import(
      "./devServer"
    );

    const servers = await startAllSlidesDevServer({ basePort: 4000 });

    expect(servers).toEqual([]);
    expect(spawnMock).not.toHaveBeenCalled();

    stopAllDevServers(servers);
  });

  it("reuses running server info", async () => {
    const slidesRoot = join(tempRoot, "slides");
    const slideDir = join(slidesRoot, "alpha");

    mkdirSync(join(slideDir, "node_modules"), { recursive: true });
    writeFileSync(join(slideDir, "package.json"), "{}");

    collectSlidesMock.mockReturnValue([
      { slideDir, slideName: "alpha", slidesDir: slidesRoot },
    ]);

    const { startAllSlidesDevServer, stopAllDevServers } = await import(
      "./devServer"
    );

    const first = await startAllSlidesDevServer({ basePort: 4000 });
    const second = await startAllSlidesDevServer({ basePort: 5000 });

    expect(first[0]?.port).toBe(4000);
    expect(second[0]?.port).toBe(4000);
    expect(spawnMock).toHaveBeenCalledTimes(1);

    stopAllDevServers(first);
  });

  it("stopAllDevServers terminates processes", async () => {
    const slidesRoot = join(tempRoot, "slides");
    const slideDir = join(slidesRoot, "alpha");

    mkdirSync(join(slideDir, "node_modules"), { recursive: true });
    writeFileSync(join(slideDir, "package.json"), "{}");

    collectSlidesMock.mockReturnValue([
      { slideDir, slideName: "alpha", slidesDir: slidesRoot },
    ]);

    const { startAllSlidesDevServer, stopAllDevServers } = await import(
      "./devServer"
    );

    const servers = await startAllSlidesDevServer({ basePort: 4000 });
    const proc = servers[0]?.process as { kill?: () => void };

    stopAllDevServers(servers);

    expect(proc.kill).toHaveBeenCalled();
  });
});
