import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type CollectSlidesParams = {
  slidesDirs: string[];
  names?: string[];
  exclude?: string[];
};

type SlideEntry = {
  slidesDir: string;
  slideName: string;
  slideDir: string;
};

export function collectSlides({
  slidesDirs,
  names = [],
  exclude = [],
}: CollectSlidesParams): SlideEntry[] {
  const entries: SlideEntry[] = [];

  const isExcluded = (name: string) =>
    name
      .split(/[\\/]+/)
      .filter(Boolean)
      .some((segment) => exclude.includes(segment));

  const hasSlidesFile = (dir: string) => existsSync(join(dir, "slides.md"));
  const readChildDirs = (dir: string) =>
    readdirSync(dir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((name) => !exclude.includes(name))
      .sort((a, b) => a.localeCompare(b));

  const walk = (slidesDir: string, dir: string, relativePath: string) => {
    if (hasSlidesFile(dir)) {
      if (relativePath) {
        entries.push({
          slidesDir,
          slideName: relativePath,
          slideDir: dir,
        });
      }
      return;
    }

    for (const childName of readChildDirs(dir)) {
      const childRelative = relativePath
        ? `${relativePath}/${childName}`
        : childName;
      if (isExcluded(childRelative)) {
        continue;
      }
      walk(slidesDir, join(dir, childName), childRelative);
    }
  };

  for (const slidesDir of slidesDirs) {
    if (!existsSync(slidesDir)) {
      console.warn(`⚠️ Slides directory not found: ${slidesDir}`);
      continue;
    }

    if (names.length > 0) {
      for (const slideName of names) {
        if (isExcluded(slideName)) {
          continue;
        }
        const slideDir = join(slidesDir, slideName);
        if (!existsSync(slideDir)) {
          continue;
        }
        if (!hasSlidesFile(slideDir)) {
          continue;
        }
        entries.push({ slidesDir, slideName, slideDir });
      }
      continue;
    }

    walk(slidesDir, slidesDir, "");
  }

  return entries;
}
