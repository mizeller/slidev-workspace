import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { collectSlides } from "./collectSlides";

let tempRoot: string;

describe("slides helpers", () => {
  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), "slidev-workspace-"));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("collectSlides warns and returns empty when slidesDir is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const missingDir = join(tempRoot, "missing");
    const result = collectSlides({ slidesDirs: [missingDir] });

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      `⚠️ Slides directory not found: ${missingDir}`,
    );
    warnSpy.mockRestore();
  });

  it("collectSlides filters by provided names", () => {
    const slidesDir = join(tempRoot, "slides");
    mkdirSync(join(slidesDir, "keep"), { recursive: true });
    writeFileSync(join(slidesDir, "keep", "slides.md"), "# keep");

    const result = collectSlides({
      slidesDirs: [slidesDir],
      names: ["keep", "skip"],
    });

    expect(result).toEqual([
      {
        slidesDir,
        slideName: "keep",
        slideDir: join(slidesDir, "keep"),
      },
    ]);
  });

  it("collectSlides returns only directories when no names are provided", () => {
    const slidesDir = join(tempRoot, "slides");
    mkdirSync(join(slidesDir, "a"), { recursive: true });
    mkdirSync(join(slidesDir, "b"), { recursive: true });
    writeFileSync(join(slidesDir, "a", "slides.md"), "# a");
    writeFileSync(join(slidesDir, "b", "slides.md"), "# b");
    writeFileSync(join(slidesDir, "file.txt"), "ignore");

    const result = collectSlides({ slidesDirs: [slidesDir] }).sort((a, b) =>
      a.slideDir.localeCompare(b.slideDir),
    );

    expect(result).toEqual([
      {
        slidesDir,
        slideName: "a",
        slideDir: join(slidesDir, "a"),
      },
      {
        slidesDir,
        slideName: "b",
        slideDir: join(slidesDir, "b"),
      },
    ]);
  });

  it("collectSlides excludes directories from options", () => {
    const slidesDir = join(tempRoot, "slides");
    mkdirSync(join(slidesDir, "keep"), { recursive: true });
    mkdirSync(join(slidesDir, "skip"), { recursive: true });
    writeFileSync(join(slidesDir, "keep", "slides.md"), "# keep");
    writeFileSync(join(slidesDir, "skip", "slides.md"), "# skip");

    const result = collectSlides({
      slidesDirs: [slidesDir],
      exclude: ["skip"],
    });

    expect(result).toEqual([
      {
        slidesDir,
        slideName: "keep",
        slideDir: join(slidesDir, "keep"),
      },
    ]);
  });

  it("collectSlides returns entries with computed slideDir", () => {
    const slidesDir1 = join(tempRoot, "slides1");
    const slidesDir2 = join(tempRoot, "slides2");
    mkdirSync(join(slidesDir1, "alpha"), { recursive: true });
    mkdirSync(join(slidesDir2, "beta"), { recursive: true });
    writeFileSync(join(slidesDir1, "alpha", "slides.md"), "# alpha");
    writeFileSync(join(slidesDir2, "beta", "slides.md"), "# beta");

    const result = collectSlides({
      slidesDirs: [slidesDir1, slidesDir2],
    }).sort((a, b) => a.slideDir.localeCompare(b.slideDir));

    expect(result).toEqual([
      {
        slidesDir: slidesDir1,
        slideName: "alpha",
        slideDir: join(slidesDir1, "alpha"),
      },
      {
        slidesDir: slidesDir2,
        slideName: "beta",
        slideDir: join(slidesDir2, "beta"),
      },
    ]);
  });

  it("collectSlides discovers nested slide folders as categories", () => {
    const slidesDir = join(tempRoot, "slides");
    mkdirSync(join(slidesDir, "category", "nested"), { recursive: true });
    mkdirSync(join(slidesDir, "category", "extra"), { recursive: true });
    mkdirSync(join(slidesDir, "flat"), { recursive: true });
    writeFileSync(join(slidesDir, "category", "nested", "slides.md"), "# n");
    writeFileSync(join(slidesDir, "category", "extra", "slides.md"), "# e");
    writeFileSync(join(slidesDir, "flat", "slides.md"), "# flat");

    const result = collectSlides({ slidesDirs: [slidesDir] }).sort((a, b) =>
      a.slideDir.localeCompare(b.slideDir),
    );

    expect(result).toEqual([
      {
        slidesDir,
        slideName: "category/extra",
        slideDir: join(slidesDir, "category", "extra"),
      },
      {
        slidesDir,
        slideName: "category/nested",
        slideDir: join(slidesDir, "category", "nested"),
      },
      {
        slidesDir,
        slideName: "flat",
        slideDir: join(slidesDir, "flat"),
      },
    ]);
  });

  it("collectSlides discovers slides at arbitrary nested depth", () => {
    const slidesDir = join(tempRoot, "slides");
    mkdirSync(join(slidesDir, "tech", "frontend", "vue"), {
      recursive: true,
    });
    mkdirSync(join(slidesDir, "tech", "backend", "node"), {
      recursive: true,
    });
    mkdirSync(join(slidesDir, "misc"), { recursive: true });
    writeFileSync(
      join(slidesDir, "tech", "frontend", "vue", "slides.md"),
      "# vue",
    );
    writeFileSync(
      join(slidesDir, "tech", "backend", "node", "slides.md"),
      "# node",
    );
    writeFileSync(join(slidesDir, "misc", "slides.md"), "# misc");

    const result = collectSlides({ slidesDirs: [slidesDir] }).sort((a, b) =>
      a.slideDir.localeCompare(b.slideDir),
    );

    expect(result).toEqual([
      {
        slidesDir,
        slideName: "misc",
        slideDir: join(slidesDir, "misc"),
      },
      {
        slidesDir,
        slideName: "tech/backend/node",
        slideDir: join(slidesDir, "tech", "backend", "node"),
      },
      {
        slidesDir,
        slideName: "tech/frontend/vue",
        slideDir: join(slidesDir, "tech", "frontend", "vue"),
      },
    ]);
  });
});
