# 1-stud building (Roblox environments)

This project builds Roblox environment pieces in "1-stud" style: a 1-stud grid, axis-aligned parts, uniform repetition, curves and tapers made by stepping, detail from wedges, cylinders and balls. Output is an `.rbxmx` you drop into Studio, plus an HTML preview.

## Before building anything
1. Read `skills/one-stud/style.md` (rules), then `references.md`, `tools.md`, `large-sets.md` as needed. `history.md` is the session log, `units.md` is for characters (shelved).
2. Reuse the generators in the root instead of rewriting them:
   - `block-kit.js` (parts, rbxmx export, `zfight`, `gridCheck`, `scaleCheck`), `stud-kit.js` (`vox()` cells + wedges, `plates()` ground cover)
   - `forest-1stud.js` / `forest-corner.js` (trunk, roots, weld splotches, ground tile)
   - `oak-gen.js` (5 oak kinds), `snow-pines.js` (pines), `fallen-trees.js` (stumps, fallen oak/pine), `flowers-v2.js` (flowers)
   - `classic-kit.js` (approved free-placed props)
3. Look at the finished examples to copy structure: `Oak Glade Dressed.dc.html` (+ `glade-blockout.js`, `glade-dressing.js`), `Snow Camp Dressed.dc.html`, `Sandy Plateau.dc.html`.

## Workflow for any scene
- Ask the user the scene type, biome and species, size (60×60 is a good scope), landmark, part budget.
- Build in stages and get approval after each: blockout (heights, paths, water, zones in plain tones) → key spots / landmarks → terrain dressing and trees → props → polish and checks.
- Put all trees in ONE shared `vox` so crowns merge. Keep a clear head height (no foliage below 7 studs).
- Checks must be clean before export: `zfight` = 0, `gridCheck` = [], `scaleCheck` = []. Nothing may sit inside terrain.
- Previews use `Studs` / `Weld` / `Inlet` MaterialVariants (`src/material-variants.json`); the download includes them.

## Preferences
Terse replies. Fewer, quieter props beat a full set. Don't over-apply a reference: reuse one or two of its ideas. No Neon. Crates and barrels are user-supplied.
