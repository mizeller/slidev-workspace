import { readFileSync, existsSync } from "fs";
import { join, basename } from "path";
import { parse as parseYaml } from "yaml";
import { loadConfig, resolveSlidesDirs } from "./config.js";
import type { SlideFrontmatter, SlideInfo } from "../types/slide.js";
import { collectSlides } from "./collectSlides";

// Get the frontmatter and content of a slide from a specific path
export function getSlideFrontmatterByPath(
  slideDir: string,
  slideName: string,
  options: { rootCategory?: string } = {},
): SlideInfo | null {
  try {
    const config = loadConfig();
    const fullPath = join(slideDir, slideName, "slides.md");

    // Check if the slide file exists
    if (!existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      return null;
    }

    const content = readFileSync(fullPath, "utf8");

    // Parse frontmatter (YAML format between ---)
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);

    if (!frontmatterMatch) {
      console.warn(`Frontmatter not found in ${fullPath}`);
      return null;
    }

    const frontmatterYaml = frontmatterMatch[1];
    const frontmatter = parseYaml(frontmatterYaml) as SlideFrontmatter;

    // Create unique ID from source directory and slide name
    const sourceBasename = basename(slideDir);
    const slideId = `${sourceBasename}/${slideName}`;
    const nameSegments = slideName
      .split(/[\\/]+/)
      .filter((segment) => segment.length > 0);
    const categoryFromPath =
      nameSegments.length > 1 ? nameSegments.slice(0, -1).join("/") : undefined;
    const rootCategory = options.rootCategory ?? sourceBasename;
    const category = categoryFromPath ?? rootCategory;

    // Check if og-image.png exists in the slide directory
    const ogImagePath = join(slideDir, slideName, "og-image.png");
    const hasOgImage = existsSync(ogImagePath);

    return {
      id: slideId,
      path: slideName,
      fullPath,
      sourceDir: slideDir,
      category,
      frontmatter,
      content: content.replace(frontmatterMatch[0], ""), // Remove frontmatter section
      baseUrl: config.baseUrl,
      hasOgImage,
    };
  } catch (error) {
    console.error(
      `Error parsing frontmatter for ${slideName} in ${slideDir}:`,
      error,
    );
    return null;
  }
}

// Get the frontmatter and content for all slides from all configured directories
export function getAllSlidesFrontmatter(): SlideInfo[] {
  const config = loadConfig();
  const slidesDirs = resolveSlidesDirs(config);

  const entries = collectSlides({
    slidesDirs,
    exclude: config.exclude,
  });

  const slides: SlideInfo[] = [];

  for (const { slidesDir, slideName } of entries) {
    const rootCategory = basename(slidesDir);
    const slideInfo = getSlideFrontmatterByPath(slidesDir, slideName, {
      rootCategory,
    });
    if (slideInfo) {
      slides.push(slideInfo);
    }
  }

  return slides;
}

// If this file is run directly, output all slides' frontmatter
if (import.meta.url === `file://${process.argv[1]}`) {
  const slides = getAllSlidesFrontmatter();
  console.log(JSON.stringify(slides, null, 2));
}
