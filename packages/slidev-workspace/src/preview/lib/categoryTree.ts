export interface CategoryNodeInput {
  name: string;
  categories?: CategoryNodeInput[];
  count?: number;
  path?: string;
}

export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
}

type RawNode = {
  name: string;
  path: string;
  children: RawNode[];
};

export function normalizeCategories(
  categories: CategoryNodeInput[],
): TreeNode[] {
  if (categories.length === 0) return [];
  const hasTreeShape = categories.some(
    (category) => category.categories && category.categories.length > 0,
  );

  const rawNodes = sortRawNodes(
    hasTreeShape
      ? buildTreeFromNested(categories)
      : buildTreeFromFlat(categories),
  );

  return finalizeNodes(rawNodes);
}

function buildTreeFromNested(
  categories: CategoryNodeInput[],
  parentPath = "",
): RawNode[] {
  return categories
    .map((category) => {
      const path =
        category.path ??
        (parentPath ? `${parentPath}/${category.name}` : category.name);
      return {
        name: category.name,
        path,
        children: buildTreeFromNested(category.categories ?? [], path),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildTreeFromFlat(categories: CategoryNodeInput[]): RawNode[] {
  const root: RawNode[] = [];

  for (const category of categories) {
    const categoryPath = category.path ?? category.name;
    const segments = categoryPath.split("/").filter(Boolean);
    let current = root;
    let currentPath = "";

    for (const segment of segments) {
      const nextPath = currentPath ? `${currentPath}/${segment}` : segment;
      let node = current.find((candidate) => candidate.path === nextPath);
      if (!node) {
        node = {
          name: segment,
          path: nextPath,
          children: [],
        };
        current.push(node);
      }
      current = node.children;
      currentPath = nextPath;
    }
  }

  return root.sort((a, b) => a.name.localeCompare(b.name));
}

function finalizeNodes(nodes: RawNode[]): TreeNode[] {
  return nodes.map((node) => ({
    name: node.name,
    path: node.path,
    children: finalizeNodes(node.children),
  }));
}

function sortRawNodes(nodes: RawNode[]): RawNode[] {
  return nodes
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((node) => ({
      ...node,
      children: sortRawNodes(node.children),
    }));
}
