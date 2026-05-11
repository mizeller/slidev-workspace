#!/usr/bin/env python3
"""
Migrate a single Slidev project into a Slidev workspace structure.

Usage:
    python3 migrate.py [--slides-dir <path>] [--workspace-name <name>] [--base-url <url>]

Arguments:
    --slides-dir      Path to the existing single Slidev project (default: current directory)
    --workspace-name  Name for the new workspace root directory (default: <project>-workspace)
    --base-url        baseUrl for slidev-workspace.yaml (e.g. /my-slides)
"""

import argparse
import json
import os
import shutil
import sys
from pathlib import Path


def detect_slidev_project(path: Path) -> bool:
    """Check if path contains a Slidev project."""
    has_slides_md = (path / "slides.md").exists()
    has_pkg = (path / "package.json").exists()
    if not (has_slides_md and has_pkg):
        return False
    pkg = json.loads((path / "package.json").read_text())
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    return "@slidev/cli" in deps


def already_workspace(path: Path) -> bool:
    """Check if path is already a workspace root."""
    return (path / "slidev-workspace.yaml").exists() or (path / "pnpm-workspace.yaml").exists()


def migrate(slides_dir: Path, workspace_name: str, base_url: str):
    slides_dir = slides_dir.resolve()

    if not detect_slidev_project(slides_dir):
        print(f"❌ No Slidev project detected at {slides_dir}")
        print("   Expected: slides.md + package.json with @slidev/cli dependency")
        sys.exit(1)

    project_name = slides_dir.name
    workspace_root = slides_dir.parent / workspace_name

    if workspace_root.exists():
        print(f"❌ Directory already exists: {workspace_root}")
        print("   Remove it or choose a different --workspace-name")
        sys.exit(1)

    print(f"📁 Creating workspace: {workspace_root}")
    workspace_root.mkdir(parents=True)
    slides_dest = workspace_root / "slides" / project_name
    slides_dest.parent.mkdir()

    # Copy the Slidev project into slides/<project-name>/
    print(f"📦 Moving {project_name} → slides/{project_name}/")
    shutil.copytree(
        slides_dir,
        slides_dest,
        ignore=shutil.ignore_patterns("node_modules", ".git", "dist", ".DS_Store"),
    )

    # Update the slide project's package.json dev script to include --base
    pkg_path = slides_dest / "package.json"
    pkg = json.loads(pkg_path.read_text())
    scripts = pkg.get("scripts", {})
    if "dev" in scripts:
        import re
        # Always set --base to the destination folder name, replacing any existing --base value
        new_dev = re.sub(r"\s+--base\s+\S+", "", scripts["dev"]).rstrip()
        scripts["dev"] = f"{new_dev} --base /{project_name}/"
        pkg["scripts"] = scripts
        pkg_path.write_text(json.dumps(pkg, indent=2, ensure_ascii=False) + "\n")
        print(f"✏️  Updated dev script: {scripts['dev']}")

    # Create root package.json
    root_pkg = {
        "name": workspace_name,
        "version": "0.0.0",
        "private": True,
        "type": "module",
        "scripts": {
            "dev": "slidev-workspace preview",
            "build": "slidev-workspace build",
        },
        "devDependencies": {
            "slidev-workspace": "latest",
        },
    }
    (workspace_root / "package.json").write_text(json.dumps(root_pkg, indent=2) + "\n")
    print("✏️  Created root package.json")

    # Warn if slide uses pnpm catalog: versions
    all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    uses_catalog = any(v == "catalog:" for v in all_deps.values())

    # Create pnpm-workspace.yaml
    catalog_block = "\ncatalog:\n  # TODO: copy your catalog versions here\n  # '@slidev/cli': latest\n" if uses_catalog else ""
    (workspace_root / "pnpm-workspace.yaml").write_text(
        f"packages:\n  - 'slides/*'\n{catalog_block}"
    )
    print("✏️  Created pnpm-workspace.yaml")
    if uses_catalog:
        print("⚠️  pnpm catalog: versions detected — fill in the catalog: section in pnpm-workspace.yaml before running pnpm install")

    # Create slidev-workspace.yaml
    effective_base_url = base_url or f"/{workspace_name}"
    config = f"""hero:
  title: "Slide Collection"
  description: "Browse all available slide decks"

baseUrl: "{effective_base_url}"
"""
    (workspace_root / "slidev-workspace.yaml").write_text(config)
    print("✏️  Created slidev-workspace.yaml")

    print()
    print(f"✅ Migration complete!")
    print()
    print(f"📂 Workspace structure:")
    print(f"   {workspace_root.name}/")
    print(f"   ├── slides/")
    print(f"   │   └── {project_name}/")
    print(f"   ├── package.json")
    print(f"   ├── pnpm-workspace.yaml")
    print(f"   └── slidev-workspace.yaml")
    print()
    print(f"🚀 Next steps:")
    print(f"   cd {workspace_root}")
    print(f"   pnpm install")
    print(f"   pnpm dev")


def main():
    parser = argparse.ArgumentParser(description="Migrate a Slidev project to workspace")
    parser.add_argument("--slides-dir", default=".", help="Path to the Slidev project")
    parser.add_argument("--workspace-name", default=None, help="Name for the workspace root")
    parser.add_argument("--base-url", default=None, help="baseUrl for slidev-workspace.yaml")
    args = parser.parse_args()

    slides_dir = Path(args.slides_dir)
    workspace_name = args.workspace_name or f"{slides_dir.resolve().name}-workspace"

    migrate(slides_dir, workspace_name, args.base_url)


if __name__ == "__main__":
    main()
