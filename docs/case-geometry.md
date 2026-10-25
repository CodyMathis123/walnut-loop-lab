# Cabinet geometry and measurements

Updated October 25, 2026. Approximate measurements are indicated.

## Structure
- Case: **21½″ W × 20″ D × 29″ H**, including two **¾″ side doors**.
- Front and rear each comprise one continuous **¾″ thick, 20″-wide walnut end panel** with **two lower fan openings and one upper window**.
- Six depthwise rails, each **2″ wide × ¾″ high**: bottom left/center/right, one center at upper support, and two upper edge rails. A steel divider runs front-to-back in the lower cabinet.
- Motherboard tray support is about **19¼″** from base; measured vertical lower chamber span **18½″**, and top opening **16″ × 18½″**.

## Cutouts in each end panel
The working model interprets horizontal offsets relative to the **20″-wide end panel** (excluding side doors). Verify the reference edges before using dimensions to fabricate.

| Opening | Size | Placement |
| --- | --- | --- |
| Left lower fan bank | ~**122 × 362 mm** | **3¼″ (82.55 mm)** above panel base; **1¾″ (44.45 mm)** from left end-panel edge |
| Right lower fan bank | ~**122 × 362 mm** | **3¼″ (82.55 mm)** above panel base; **1¾″ (44.45 mm)** from right end-panel edge |
| Upper window / rear motherboard opening | **13″ (330.2 mm)** wide × **8¼″ (209.55 mm)** high | **3½″ (88.9 mm)** in from each side; **1½″ (38.1 mm)** below top |

- Front and rear openings are modeled identically, as real cuts through ¾″-thick panels with edge faces.
- Fan opening top is about **17½″**, window bottom **19¼″** above panel base, flush with the **19¼″ upper support top**; approximately **1¾″** of walnut between the fan openings and upper window.
- A nominal three-fan 120 × 360 mm assembly is nearly flush in a 122 × 362 mm cutout (~1 mm clearance on each side before tolerance).
- Radiator ports separately measured at approximately **18¼″** above base, and about **3″ and 5½″** in from the outside side edge. These do not dictate fan-cutout centerlines.

## Open measurements
Check exact cutout sizes, corner radii and fan bolt pattern; whether horizontal offsets refer to end-panel or outside case edges; fan/radiator depth, motherboard tray mounting, reservoir and pump positions, and block port centers.

## Model convention
X = horizontal; Y = height from floor; Z = front/back. Millimeters throughout. This is a conceptual routing/fit viewer, **not a certified cutting drawing**.

## Radiator/fan assembly modeling (v0.9)

- Four independent fan openings: `front-left`, `front-right`, `rear-left`, `rear-right`. Installed radiators can be assigned to one opening apiece.
- A radiator carries **two fan counts**, 0–3 each: **panel side**, between the radiator and the corresponding end panel; and **inner side**, toward the center of the case. 3 + 3 means six fans in a push/pull-style stack, and 3 + 0 means three on one face.
- Fan frames are modeled at **120 × 120 mm** and **25.4 mm depth** by default. The depth is editable globally. Radiator body dimensions are independently editable; starter dimensions **135 × 380 × 64 mm** are approximations, not confirmed radiator specifications.
- For one fan, use the center row; for two, top and bottom; for three, all rows. The fans physically follow the radiator as the component moves.
- Bare openings may instead hold **0–3 fan-only frames** at the panel, to model airflow-only bays.
- The current radiator slot attachments put the radiator/fan assembly just inside the corresponding end panel. Stack depth is body depth plus one fan thickness for each populated side.
- Radiator ports remain separate editable offsets; fan mounting does not automatically calibrate G1/4 port or screw-hole coordinates.
- Fan rotation / intake vs exhaust direction and exact mounting fasteners are **not yet modeled**. Visually inspect case clearances before assembly. No collision detection is provided.

**Historical v0.9 sample (superseded):** two right-hand radiators with push/pull and six standalone left-hand fans. See the v0.11 section for the current four-radiator starting layout.

## Editor display and depth sorting (v0.10)

- The model uses a single painter-style sorted list of front/rear walnut-panel surfaces, inner cutout faces, radiator and fan faces, optional other components, and their detail strokes.
- **Cooling view** hides provisional motherboard, CPU/GPU, reservoir, pump and drain geometry without removing any components or saved tubing routes. **Other parts** reveals them. Existing project geometry and visibility flags are preserved.
- The steel divider is rendered as an opaque dark panel; the cutout panels use even-odd polygon holes.
- This improves visible occlusion but is *not a geometric collision solver*. Intersecting mesh faces, hard tubing, and fit tolerances are approximate.
- The normal editor keeps component and fan controls immediately visible. Geometry, route and cost settings are available inside expandable sections; explanatory history stays in repository documentation.

## v0.11 — fan cutouts and all-four radiator preset

- The four cutouts are occupied in the fresh sample by **four 360 mm radiator assemblies**, each with **three front/panel-side and three rear/inside fans** (24 fans total). This is a configurable mockup, not a statement about the number of physical radiators on hand.
- The **outside face of each panel-facing fan** sits at the 20″ end-panel's outside surface. A 120 × 120 mm fan occupies the approximate 122 × 362 mm cutout (three fans tall); its 25.4 mm thickness passes through the 19.05 mm walnut and projects **6.35 mm inward**. A radiator rests behind this bank; additional fans attach to its other face.
- Removing or hiding a radiator clears its opening. A user can substitute 0–3 standalone fans in an empty opening; attached counts remain editable per radiator from 0 to 3 on each side.
- **Preset: 4 radiators · 3+3 fans** fills all four slots on request without resetting unrelated motherboard/pump settings. Existing saved radiator assignments and hand-positioned coordinates are otherwise retained. Projects from before the mounting-depth correction are adjusted only when their old Z coordinates still match auto-positioned defaults.
- Opaque front/rear panel faces are subdivided into strips beside and between cutouts so the depth sorter does not try to render an entire cabinet side at a single mean depth. Fan frames are now modeled as four rails with an open center, not one solid 120 × 120 mm plane. This improves the transparency artifacts, but is still **not a true WebGL depth buffer or collision solver**.

## v0.12 — root cause and actual GPU rendering

The screenshot's intermittent transparency came from the original custom painter's algorithm. A globally sorted stack of 2D-projected polygons based on average face distance cannot accurately decide which portions of overlapping 3D surfaces are hidden. Tiling the panel faces reduced, but did not solve, the issue.

The default GPU rendering path now uses **Three.js 0.186.1** and the WebGL depth buffer to resolve visibility *per pixel*. All geometry remains produced by the existing planner's world-space face and line commands, so this is a rendering swap rather than a new dimensions or data model.

- `assets/renderer-webgl.js` receives model geometry via the `window.WalnutLoopRenderBridge` / `window.WalnutLoopWebGL` handshake and displays batched GPU meshes.
- Solid surfaces use `depthTest: true`, `depthWrite: true`. Transparent surfaces do not write to the depth buffer.
- Orbiting reuses GPU buffers; editing invalidates and rebuilds them while disposing old geometry. The orthographic camera matches existing model coordinates and gestures.
- The original Canvas/SVG renderer is still usable when WebGL is not available, and can be selected manually. Three.js loads as a pinned ES module from jsDelivr; GitHub Pages still requires no build step.
- Known limitations: 2D dimensions/labels remain overlays, tubing route lines are not full volumetric tube meshes, and there is no physical collision detection. Optional translucent components can still require specialized transparency handling.

Verification commands: `node tests/smoke-check.mjs`, `node tests/webgl-smoke-check.mjs`.

## v0.13 — component profiles

**Manufacturer sources:**

- [120MOTRAY-BW modular ATX 120 mm assembly](https://www.mountainmods.com/MountainMods-Modular-Removable-Motherboard-Tray-Assembly%28ATX%29-120-Black-Wrinkle)
- [ATXTOAB anodized black tray](https://www.mountainmods.com/atx_tray_anodized_black)
- [Manufacturer photo of full assembly](https://www.mountainmods.com/image/cache/catalog/120MOTRAY-BW-8-800x800.png)
- [Manufacturer photo of tray-only sheet](https://www.mountainmods.com/image/cache/catalog/ATXAB-800x800.png)

The bottom tray has confirmed dimensions **276.86 × 323.85 mm** and modeled nominal **1.65 mm** sheet thickness. The large CPU access hole, folded edges, attachment feet and stand-offs are rendered, but the detailed offsets are schematic. The 120 mm fan and seven PCI slot openings are represented as actual unfilled holes in the rear panel, not dark painted rectangles. The separate rear panel is rotated horizontally to fit the physical case's **13 × 8.25 inch rear window**; its current bounding profile is **310 mm wide × 183 mm high**, with top below window top and bottom near the middle support. Manufacturer did not state this back-panel size; the profile is approximate. The entire tray assembly moves with the existing 'tray' part's coordinates and remains compatible with saved JSON.

All four 360 mm radiators have corrected **60 mm nominal thickness** (previous 64 mm placeholder), unchanged nominal **135 × 380 mm** face dimensions until measured, and finned front and rear cores, mounting rails, metal end tanks, and circular G1/4-style port features at the existing editable port offsets. Saved 64 mm stock radiator dimensions upgrade to 60 mm, preserving non-default manually moved centers. Custom sizes are retained. The motherboard tray is always visible in cooling view; toggle **Other parts** to add the rest of the upper chamber.

The component mesh source is `assets/part-geometry.js`; it uses the same `box`, `polygon`, `stroke`, and `circle3` primitives as the rest of the app, so Canvas, SVG and GPU renderer share geometry. Geometry checks: `node tests/component-geometry-check.mjs`.
