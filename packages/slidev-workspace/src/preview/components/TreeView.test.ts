import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import TreeView from "./TreeView.vue";
import type { TreeNode } from "../lib/categoryTree";

const sampleNodes: TreeNode[] = [
  {
    name: "tech-slides",
    path: "tech-slides",
    children: [],
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
];

describe("TreeView", () => {
  it("emits expanded updates for parent nodes", async () => {
    const onUpdateExpanded = vi.fn();

    render(TreeView, {
      props: {
        nodes: sampleNodes,
        selected: "",
        expanded: new Set<string>(),
        "onUpdate:selected": vi.fn(),
        "onUpdate:expanded": onUpdateExpanded,
      },
    });

    const techButton = screen.getByRole("button", { name: "tech" });
    expect(techButton.getAttribute("aria-expanded")).toBe("false");

    await fireEvent.click(techButton);

    expect(onUpdateExpanded).toHaveBeenCalledTimes(1);
    const nextExpanded = onUpdateExpanded.mock.calls[0][0] as Set<string>;
    expect(nextExpanded.has("tech")).toBe(true);
  });

  it("emits selection updates for leaf nodes", async () => {
    const onUpdateSelected = vi.fn();

    render(TreeView, {
      props: {
        nodes: sampleNodes,
        selected: "",
        expanded: new Set<string>(["tech"]),
        "onUpdate:selected": onUpdateSelected,
        "onUpdate:expanded": vi.fn(),
      },
    });

    const slidesButton = screen.getByRole("button", { name: "slides" });
    await fireEvent.click(slidesButton);

    expect(onUpdateSelected).toHaveBeenCalledWith("tech/slides");
  });
});
