import { describe, it, expect } from "vitest";

import { normalizeCategories, type CategoryNodeInput } from "./categoryTree";

describe("normalizeCategories", () => {
  it("returns an empty array when no categories are provided", () => {
    expect(normalizeCategories([])).toEqual([]);
  });

  it("builds a tree from flat category paths and sorts nodes", () => {
    const input: CategoryNodeInput[] = [
      { name: "tech/workshops" },
      { name: "design/systems" },
      { name: "tech/slides" },
    ];

    expect(normalizeCategories(input)).toEqual([
      {
        name: "design",
        path: "design",
        children: [
          {
            name: "systems",
            path: "design/systems",
            children: [],
          },
        ],
      },
      {
        name: "tech",
        path: "tech",
        children: [
          {
            name: "slides",
            path: "tech/slides",
            children: [],
          },
          {
            name: "workshops",
            path: "tech/workshops",
            children: [],
          },
        ],
      },
    ]);
  });

  it("prefers nested shape when provided and respects explicit paths", () => {
    const input: CategoryNodeInput[] = [
      {
        name: "tech",
        categories: [{ name: "workshops" }, { name: "slides" }],
      },
      {
        name: "design",
      },
      {
        name: "special",
        path: "custom",
        categories: [{ name: "vip" }],
      },
    ];

    expect(normalizeCategories(input)).toEqual([
      {
        name: "design",
        path: "design",
        children: [],
      },
      {
        name: "special",
        path: "custom",
        children: [
          {
            name: "vip",
            path: "custom/vip",
            children: [],
          },
        ],
      },
      {
        name: "tech",
        path: "tech",
        children: [
          {
            name: "slides",
            path: "tech/slides",
            children: [],
          },
          {
            name: "workshops",
            path: "tech/workshops",
            children: [],
          },
        ],
      },
    ]);
  });
});
