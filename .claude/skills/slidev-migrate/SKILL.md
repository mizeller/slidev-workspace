---
name: slidev-migrate
description: Migrate a single Slidev project into a Slidev workspace structure. Use when the user wants to convert an existing single Slidev project (slides.md + package.json) into a multi-presentation workspace managed by slidev-workspace. Triggers on phrases like "migrate to workspace", "convert to workspace", "set up slidev workspace", "move my slidev to workspace", or any request to organize multiple Slidev presentations under one workspace.
---

# slidev-migrate

Migrate a single Slidev project to a `slidev-workspace` structure.

## What the migration does

**Before:**

```
my-talk/
├── slides.md
├── package.json   (@slidev/cli dependency)
├── components/
└── ...
```

**After:**

```
my-talk-workspace/
├── slides/
│   └── my-talk/          ← original project moved here
│       ├── slides.md
│       ├── package.json   (dev script updated with --base)
│       └── ...
├── package.json           ← new root (slidev-workspace scripts)
├── pnpm-workspace.yaml
└── slidev-workspace.yaml  ← hero/baseUrl config
```

## Automated migration (recommended)

Run the migration script:

```bash
python3 .claude/skills/slidev-migrate/scripts/migrate.py \
  --slides-dir <path-to-single-slidev-project> \
  --workspace-name <new-workspace-folder-name> \
  --base-url /<repo-name>
```

The script:

1. Validates a Slidev project exists (`slides.md` + `@slidev/cli` in `package.json`)
2. Creates `slides/<project-name>/` with the project files (excluding `node_modules`, `dist`, `.git`)
3. Updates the slide's `dev` script to add `--base /<folder-name>/`
4. Generates root `package.json`, `pnpm-workspace.yaml`, and `slidev-workspace.yaml`

After running:

```bash
cd <workspace-name>
pnpm install
pnpm dev    # starts slidev-workspace preview
```

## Manual migration steps

If the script doesn't fit (e.g., monorepo, in-place migration):

1. **Move the project** into `slides/<project-name>/`
2. **Update the dev script** in the slide's `package.json`:
   ```json
   "dev": "slidev --base /<project-name>/"
   ```
3. **Create `pnpm-workspace.yaml`** at workspace root:
   ```yaml
   packages:
     - "slides/*"
   ```
4. **Create `slidev-workspace.yaml`** at workspace root:
   ```yaml
   hero:
     title: "My Slide Collection"
     description: "Browse all available slide decks"
   baseUrl: "/<repo-name>"
   ```
5. **Create root `package.json`**:
   ```json
   {
     "name": "my-workspace",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "slidev-workspace preview",
       "build": "slidev-workspace build"
     },
     "devDependencies": {
       "slidev-workspace": "latest"
     }
   }
   ```
6. Run `pnpm install` and `pnpm dev`

## Adding more slides after migration

Add more presentations by placing subdirectories inside `slides/`. Each needs a `slides.md` and a `package.json` with a `dev` script that includes `--base /<folder-name>/`.

## Key configuration options

`slidev-workspace.yaml`:

- `baseUrl` — URL base path; must match GitHub repo name for GitHub Pages
- `hero.title` / `hero.description` — workspace landing page text
- `sidebar.title` / `sidebar.githubUrl` — sidebar branding
- `outputDir` — build output directory (default: `./dist`)
- `exclude` — folder names to skip

## Caveats

- **pnpm catalog:** If the slide's `package.json` uses `catalog:` versions, the workspace root needs a `catalog:` section in `pnpm-workspace.yaml`. Ask the user if they use pnpm catalogs.
- **In-place migration:** If the user wants to convert the current directory (not create a parent workspace), create a `slides/` subfolder, move files in, and add the config files at the same root.
- **Already a workspace:** If a `pnpm-workspace.yaml` or `slidev-workspace.yaml` already exists, skip workspace creation and only add/update the config files.
