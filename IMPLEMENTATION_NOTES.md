# SetCraft Swim Studio v7 — implementation notes

## Product structure

The Studio workflow now has five internal pages:

1. Project Setup
2. Build Sets
3. Lane Plan
4. Deck Sheet
5. Review & Export

The main application sidebar exposes these as nested Swim Studio destinations and also places Project Hub under Swim Studio.

## Project storage

Projects remain stored in `localStorage` under `setcraft_studio_projects`. Folder names are stored independently under `setcraft_project_folders`, which allows empty season folders to remain visible before projects are created.

Project Hub can create and persist a starter project, create folders, move projects, duplicate projects, delete projects, and open a selected project in the Studio.

## Workspace improvements

The block workspace includes category-toolbox navigation, search, zoom, fit-to-workspace, collapse-all, expand-all, custom blocks, Favorites, Backpack, Quick Write, and deterministic calculation/validation.

## Validation completed

- TypeScript: `npm run lint`
- 111 palette preset creation checks
- Nested container insertion checks
- Move/remove/insert identity checks
- Quick Write nested-repeat calculations
- One-page portrait PDF smoke test
- Production build
