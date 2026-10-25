# Walnut Loop Lab

An interactive, static-site 3D layout planner for a custom walnut PC water-cooling case. The live editor runs on GitHub Pages and uses Three.js/WebGL with Canvas/SVG fallback.

**Status: v0.18 — greenfield prototype.** The design intentionally starts from its current default configuration on every page refresh. **Browser edits are not auto-saved and old browser drafts are discarded.** Use **Export project JSON** only when you want to keep an explicit current-version snapshot; **Import JSON** accepts v0.18-format projects only. There is **no backward-compatibility or automatic migration layer.**

[Open the live planner](https://codymathis123.github.io/walnut-loop-lab/)

## Current layout

| Assembly | Starting arrangement |
|---|---|
| Cabinet | Approx. 21.5″ W × 20″ D × 29″ H, walnut upper shell and center support |
| Radiators | Four 360 mm TFC X-Changer-style bodies, **60 mm thick**, one per lower cutout |
| Fans | Three 120 mm fans on each face of each radiator (**24 total**) |
| Loops | **GPU-left**: two left radiators, reservoir, DDC pump, and drain. **CPU-right**: two right radiators, matching reservoir, pump, and drain |
| Reservoirs | Both vertical by default; individually rotatable to horizontal (front-to-back) |
| Tray | Mountain Mods ATX removable tray and attached rear I/O/120 mm fan/PCI panel, modeled as a sheet-metal assembly |
| Motherboard | **Gigabyte X570 I AORUS PRO WIFI**, 170 × 170 mm Mini-ITX AM4 mock at rear-right of tray |
| CPU water block | Positioned above the board's approximate AM4 socket center |
| GPU | Provisional mounting position; eventual GPU/wood platform is not modeled in detail |

The motherboard and water block move with the tray when repositioning the assembly. The motherboard can be re-aligned using **Align motherboard + CPU**. The tray is kept **3 mm above the middle support** to avoid intersections; the motherboard has a nominal **6.35 mm standoff clearance**. The radiator's two G1/4-style ports are rendered on the **inward-facing vertical surface** of the upper end tank, not on its top.

## Editor functionality

- Orbit, zoom, and focus components; view 3D WebGL with optional Canvas/SVG fallback.
- Move parts and edit sizes, radiator slots, fan counts, tubing paths, and cost estimates.
- Switch **Dual GPU/CPU loops** or **Single shared loop**. Dual mode prevents cross-loop route connections; the single mode hides the spare right-side reservoir/pump/drain set.
- Independently rotate each reservoir between vertical and horizontal; ports rotate with the body.
- Adjust the tray CPU-backplate opening and align the rear bracket to the walnut window.
- Generate conceptual tubing routes with low-point capped drain branches. They are *not* validated plumbing or a collision-free routing design.
- Export a v0.18 JSON snapshot, import a v0.18 snapshot, export a PNG/SVG view, or reset the current sample.

**Prototype workflow:** Revisit or refresh to see the newest defaults. Nothing you edited previously will silently override new code changes. If you deliberately export and later import a snapshot, it must belong to the current project format.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Layout, controls, and pinned Three.js import map |
| `assets/app.js` | Editor model, placement logic, scene generation, loop controls, routes, import/export |
| `assets/part-geometry.js` | Tray, radiator, cylindrical reservoir, and Gigabyte ITX geometry |
| `assets/renderer-webgl.js` | Three.js mesh renderer, actual depth buffer and Canvas/SVG fallback bridge |
| `assets/style.css` | Responsive interface styles |
| `docs/case-geometry.md` | Measurements, design assumptions, and historical modeling notes |
| `tests/*.mjs` | Node-based regression and geometry checks |

Run regression checks locally with Node 22+:

```bash
node tests/smoke-check.mjs
node tests/component-geometry-check.mjs
node tests/cooling-layout-check.mjs
node tests/itx-layout-check.mjs
node tests/webgl-smoke-check.mjs
```

GitHub Actions runs the same suite. GitHub Pages deploys directly from the `Production` branch; there is no build step.

## Sources and model assumptions

- [GIGABYTE X570 I AORUS PRO WIFI](https://www.gigabyte.com/Motherboard/X570-I-AORUS-PRO-WIFI-rev-10): 170 × 170 mm AM4 Mini-ITX board. Socket coordinate and decorative chip placement in this model are **approximate visual references**, not verified drill coordinates.
- [Mountain Mods ATX removable motherboard tray](https://www.mountainmods.com/atx_tray_anodized_black) and [120 mm tray assembly](https://www.mountainmods.com/MountainMods-Modular-Removable-Motherboard-Tray-Assembly%28ATX%29-120-Black-Wrinkle): base tray and connected rear panel.
- Original user measurements of the walnut case and user-provided Gigabyte motherboard photo.
- TFC X-Changer-style 360 mm radiators are represented as nominal **135 × 380 × 60 mm** bodies with recessed fins, end tanks, and approximate port spacing.

**Not CAD or fabrication-grade data.** Confirm radiator clearance, fasteners, exact standoffs, pump priming/flooded inlets, drain accessibility, fan direction, water block fit and tubing routes using real hardware before drilling or filling a loop.
