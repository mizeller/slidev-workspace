<template>
  <div class="space-y-2">
    <div v-for="node in nodes" :key="node.path" class="space-y-1">
      <button
        type="button"
        class="w-full flex items-center justify-between rounded-xl text-left transition-colors"
        :class="rowClass(node, 1)"
        :aria-expanded="node.children.length > 0 ? isExpanded(node) : undefined"
        @click="handleNodeClick(node, 1)"
      >
        <span class="truncate">{{ node.name }}</span>
        <ChevronRight
          v-if="node.children.length > 0"
          class="size-4 text-muted-foreground transition-transform"
          :class="isExpanded(node) ? 'rotate-90' : ''"
        />
      </button>

      <div v-if="isExpanded(node)" class="space-y-1 pl-3">
        <div v-for="child in node.children" :key="child.path" class="space-y-1">
          <button
            type="button"
            class="w-full flex items-center justify-between rounded-lg text-left transition-colors"
            :class="rowClass(child, 2)"
            @click="handleNodeClick(child, 2)"
          >
            <span class="truncate">{{ child.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";

import type { TreeNode } from "../lib/categoryTree";

defineProps<{
  nodes: TreeNode[];
}>();

const selected = defineModel<string>("selected", { default: "" });
const expanded = defineModel<Set<string>>("expanded", {
  default: () => new Set<string>(),
});

const isExpanded = (node: TreeNode) => expanded.value.has(node.path);

const isSelected = (node: TreeNode) => selected.value === node.path;

const isAncestorSelected = (node: TreeNode) => {
  if (!selected.value) return false;
  return selected.value.startsWith(`${node.path}/`);
};

// The current TreeView UI only supports two nesting levels.
// Deeper trees should be flattened or handled by a future recursive version.
const rowClass = (node: TreeNode, level: 1 | 2) => {
  const size = level === 1 ? "px-3 py-2 text-sm" : "px-3 py-1.5 text-sm";

  if (isSelected(node)) {
    return `${size} bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-border/70 dark:ring-sidebar-border/30`;
  }

  if (isAncestorSelected(node)) {
    return `${size} bg-sidebar-accent/40 text-sidebar-foreground`;
  }

  return `${size} hover:bg-sidebar-accent/70 text-sidebar-foreground`;
};

const toggleExpanded = (node: TreeNode) => {
  const next = new Set(expanded.value);
  if (next.has(node.path)) {
    next.delete(node.path);
  } else {
    next.add(node.path);
  }
  expanded.value = next;
};

const handleNodeClick = (node: TreeNode, level: 1 | 2) => {
  if (level === 1 && node.children.length > 0) {
    toggleExpanded(node);
    return;
  }

  selected.value = node.path;
};
</script>
