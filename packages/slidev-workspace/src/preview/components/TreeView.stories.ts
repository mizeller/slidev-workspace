import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3-vite";

import "../assets/main.css";
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

type TreeViewStoryArgs = {
  nodes: TreeNode[];
  selected: string;
  expandedPaths: string[];
};

const meta: Meta<TreeViewStoryArgs> = {
  title: "Preview/TreeView",
  component: TreeView,
};

export default meta;

type Story = StoryObj<TreeViewStoryArgs>;

export const Default: Story = {
  args: {
    nodes: sampleNodes,
    selected: "tech/slides",
    expandedPaths: ["tech"],
  },
  argTypes: {
    expandedPaths: {
      control: "object",
    },
  },
  render: (args: TreeViewStoryArgs) => ({
    components: { TreeView },
    setup() {
      const selected = ref(args.selected);
      const expanded = ref(new Set(args.expandedPaths));

      return {
        args,
        selected,
        expanded,
      };
    },
    template:
      '<TreeView :nodes="args.nodes" v-model:selected="selected" v-model:expanded="expanded" />',
  }),
};
