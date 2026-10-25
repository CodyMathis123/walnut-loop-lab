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

## v0.14 — rear/right tray access cutout and left-side lower loop

The top view of the physical case and the Mountain Mods tray-only product photo were used to revise the **approximate** access-hole placement. In the custom case the tray is horizontal, with the rear I/O bracket against the walnut rear-window panel; the future ITX board is planned at the **rear/right** corner of the tray, while the remaining tray will support the GPU and potentially a shaped walnut cover. These future components are not rendered yet.

- Default tray center: **X=+76, Y=489.775, Z=−69.525 mm** (the app also aligns its center height to the upper support). The rear bracket is centered in the 330.2 mm wide rear window, about 6 mm inward from its inner walnut face. **Align tray to rear window** re-establishes this pose on demand.
- Rectangular CPU service opening: **120 mm wide × 100 mm deep**, with local tray center offset **X=+46, Z=−96 mm** (rear is negative Z, positive X is right). This leaves about 16 mm of metal between the rear edge and cutout, and about 32 mm at the right edge; these are approximations from visual references, not machining dimensions.
- The model now displays **four approximate ITX mounting standoffs** at rear/right positions. Their screw-hole coordinates have **not** been measured and must not be used as a drilling guide.
- Component editor exposes the tray's cutout width, depth, local X/Z offsets, and a rear-window alignment control. Saved JSON persists them. Older JSON configurations keep custom tray positions; only untouched old stock tray offsets are migrated.
- FrozenQ reservoir default: **[−125,300,55] mm**; DDC pump default **[−125,104,70] mm**. Both are entirely on the **negative-X side** of the X=0 steel partition, with vertical separation for the pump inlet. The physical reservoir bracket height and exact plumbing still require measurement. Existing saved layouts only migrate these positions if they match the former exact default coordinates.

## v0.15 — tray and bracket registration fix

The rear Mountain Mods I/O/PCI/120mm panel was previously drawn with its center at the tray's X minus 76 mm, causing visible lateral separation. The bracket is now attached geometrically to the right-hand tray edge:

- Bracket width: **310 mm** (approximation).
- Right edge: **trayX + trayWidth / 2 + 8 mm**.
- Left edge: right edge minus 310 mm; for stock tray this means **25.14 mm left overhang** and 8 mm right overhang.
- When the panel is centered at X=0 within the 330.2 mm-wide walnut window, the 276.86 mm tray center is **X=+8.57 mm**.

The entire assembly moves together if tray position or width changes, including both PCI slots and fan aperture. The alignment control derives tray X from the physical bracket shape. Saved projects with the old unmodified tray location get the correction without moving manually adjusted setups. Panel overhang estimates are based on the overhead reference photograph; they are not machining specifications.

## v0.16 — orientation of mounted rear motherboard panel

Correction from the real overhead reference: left-to-right across the back of the installed horizontal Mountain Mods assembly, the **seven PCI slots are LEFT**; the **120 mm fan opening is upper RIGHT** and the **motherboard I/O opening is below the fan**, nearest the ITX motherboard. The previous rendered design was mirrored. The rear bracket is still 310 mm across and anchored to the tray's right edge with the v0.15 overhang values; no case or tray positioning changes were required.

Detailed approximate panel layout in tray-relative world coordinates, where the panel spans Y = tray top to tray top +183 mm:

- Rear sheet fan region: rightmost **138 mm** wide; actual 110 mm diameter circular aperture, center Y=+119 mm from tray plate top. Standard 120 mm fan screw hole square remains at +/-52 mm.
- I/O cutout: **98 × 39 mm**, centered below fan, Y=+10..49 mm from tray top. The between-region sheet remains solid.
- Seven PCI slots: on left 172 mm wide section, each 10 mm wide, with about 21 mm X spacing and Y=+22..104 mm.

These are schematic proportions (not cut/drill templates). The geometry has separate filled sheet regions around each hole so the GPU depth renderer sees actual open holes rather than painted rectangles. Regression tests verify the positions and empty cut-through regions.
