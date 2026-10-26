# Walnut Loop Lab — geometry notes

**Current implementation: v0.24, greenfield.** Earlier release sections below are retained for measurement/reference history only. They do **not** represent compatibility guarantees or active project migrations. Browser drafts are discarded on reload and manual JSON imports require current v0.24 format. See the current `README.md` and component builders for active defaults.

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

## v0.17 — dual/single loop assemblies

Fresh-project default: **GPU left / CPU right**, each consisting of two 360 mm radiators, a matching FrozenQ reservoir, DDC/XSPC pump and its own low-point drain tee. X=0 is the center steel divider; both circulation sets occupy opposite sides:

| Component | X | Y | Z | Reservoir body orientation |
|---|---:|---:|---:|---|
| GPU reservoir (res) | -125 | 300 | 55 | vertical 72 × 238 × 72 mm |
| GPU pump (pump) | -125 | 104 | 70 | N/A |
| GPU drain (drain) | -190 | 65 | 125 | capped tee |
| CPU reservoir (res2) | +125 | 300 | 55 | vertical 72 × 238 × 72 mm |
| CPU pump (pump2) | +125 | 104 | 70 | N/A |
| CPU drain (drain2) | +190 | 65 | 125 | capped tee |

Radiator assignments default: **rad3 + rad4 GPU**, **rad1 + rad2 CPU**. CPU water block is associated with CPU, GPU block with GPU. These are logical memberships; each radiator's assignment is editable in the Components panel when dual mode is selected. Single mode shares all four radiators and the original GPU-left reservoir/pump/drain set, hides the right kit, and supports routes connecting both blocks.

Reservoir orientation is per component: **vertical** uses the long axis along Y, **horizontal** along Z (front–back). Switching orientation swaps the Y/Z physical body size and rotates all stored port offsets about X; it keeps the bottom at its former Y. Orientation and hand-edited coordinates persist in JSON. Reservoirs render as cylindrical, capped, helix-detailed approximations in the existing WebGL or Canvas/SVG pipeline (no new dependencies).

Generated example routes do not imply safe coolant design or installation readiness. A tee off pump.out connects to drain.in while the drain.out remains capped. Do not add the drain in series to ordinary pump/radiator flow. Mount pumps below a flooded reservoir outlet and verify that horizontal configurations have a suitable fill/bleed path. The planner has no true collision/flow solver.

Legacy v0.16 projects with no `loopMode` field migrate to **single** (preserving the user's established original loop), and the matching spare right hardware is appended hidden. Old untouched left drain coordinates are corrected to a left-side low point; custom settings are not overwritten. A fresh v0.17 project starts **dual**. Selecting the layout option with saved routes asks before clearing them.

## v0.18 — Gigabyte board, tray clearance and TFC X-Changer front ports

User-provided Gigabyte image: https://static.gigabyte.com/StaticFile/Image/Global/ef15bab4eac04fa62ee708c908150cb1/ProductRemoveBg/22210/webp/420 . Reference motherboard **X570 I AORUS PRO WIFI** (AM4, Mini-ITX). The plate measures **170 × 170 × 1.6 mm** in the planning model. Rear I/O faces cabinet -Z; PCIe x16 slot on -X side; two DIMM slots near +Z (front) after rotating the product view. Nominal socket center is motherboard local **(+18, -6) mm in X/Z**; refine based on direct physical measurement if fabricating an offset bracket. The CPU water block is positioned by `socketBlockPose` and moves with the motherboard. The mock includes solid PCB, I/O/VRM heatsink, AM4 socket, PCIe, DDR4 slots, and chipset/M.2 assembly.

The motherboard is mounted at rear/right of the tray, approximately 8 mm inset from its right edge and 10 mm from its rear edge, on 6.35 mm standoffs. The walnut middle support ends at `case.divider`; tray sheet underside is now **3 mm above** it. Standoff tabs can still approach wood and should be checked against the actual physical assembly. Stock tray center for unchanged case dimensions is **(8.57, 492.775, -69.525) mm**. `alignTrayToRearWindow` and `syncMeasuredRadiators` maintain this clearance and carry attached motherboard and CPU parts along. User-modified tray Y positions are preserved during import.

Each **TFC X-Changer radiator** has two ports on its **interior-facing vertical end-tank face** (front face relative to its fan-bank mount); both ports use the Z-normal face near the radiator's top, rather than the Y-normal horizontal cap. Default offsets are Y = radiator height / 2 − 9 mm and Z = inward-facing radiator depth / 2 + 1 mm, with the existing side-to-side spacing. The mesh-builder port collars are concentric rings in the Z plane. Unmodified saved Y=top stock ports are migrated; manually edited values are kept.

The mock motherboard and hardware geometry are illustrative, not a guaranteed physical component collision or clearance study.

## v0.19 — choose left/right/shared hardware and sketch tubing paths

Fresh default is two independent loops, GPU-left and CPU-right. In single mode, **singleHardwareSide** selects `right` (primary/default) or `left`, with the other reservoir/pump/drain kit hidden. Both left/right radiator banks remain available on the common shared loop. Dual displays both kits. Both reservoirs have three axial ports in vertical position: **in** bottom left [-17,-119,0], **out** bottom right [17,-119,0], **top** [0,119,0], relative to reservoir center (mm). Horizontal orientation rotates coordinates about the X axis. The top port is modeled as fill/vent; bottom ports may be used for return and pump feed. Actual FrozenQ G1/4 offsets require measurement.

Tubing routes optionally store an array of three-dimensional `waypoints`. Endpoints stay live references to component ports. Clicking a route converts its current automatic intermediate corners into draggable points and inserts another point at the clicked segment. Shift + drag changes the depth coordinate. No Shift changes horizontal screen-plane coordinate plus physical Y. Soft tubing is a Catmull-Rom-like spline with aesthetic sag; hard bends are rounded and hard elbows are polyline corners. Cost estimate recalculates routed centerline length and elbow count. Neither tight bends nor intersecting components are automatically validated.

`tests/tubing-editor-check.mjs` exercises control point insertion, dragging, Shift depth, route style/estimation, clearing route points, on both desktop and mobile UI stand-ins.

## v0.20 — selected sample tube style and fill/vent-only reservoir top port

Sample tubing generation now reads the current `styleSelect` and `axisOrder` controls. All emitted sample routes use that tubing style (`soft`, `bend`, or `elbow`) and axis order, for either dual loop or selected right/left shared hardware location. The two bottom reservoir ports `in` (return) and `out` (pump feed) participate in the circuit. The top port `top` remains modeled and visible but cannot be selected as a route endpoint, including through mouse hit-testing, manual route addition or imported current-format snapshots. It is reserved for filling/venting without a connected hose in this design. The project JSON format is `walnut-loop-v20`; no legacy migrations.

## v0.21 — obstacle-aware automatic tubing and compression fittings

The new `assets/route-geometry.js` module defines inflated AABBs for visible major component bodies, tests 3D line segments for intersections, and finds alternate paths using bounded, axis-neighbor A* when a direct/axis-order path intersects a component. It uses **real mm coordinates** and the selected tube outer diameter plus an approximate clearance margin. The current 3D obstacles include motherboard, tray, CPU/GPU blocks, radiators, reservoirs, pumps and drains. Other hoses and cabinet rails are **not** collision primitives yet. Source/destination body envelopes are excluded from the corresponding run; this is an approximate clearance planner, not physical CAD validation.

If search fails or cannot find a suitable endpoint, the route is marked `blocked` and not rendered. Generated manual waypoints override the old simple axis-order route. A manually changed or curved path that penetrates modeled boxes is shown in red with a 'Clearance needed' label; users can adjust drag handles. The automatic route generator preserves selected `axis` on unobstructed paths.

The WebGL backend understands `{kind:'tube', pts:[[x,y,z], ...], radius, color}` commands from the existing scene bridge. Each produces a radial triangular cylinder mesh rendered with GPU per-pixel depth testing. No added Three.js dependencies or build step. The Canvas/SVG renderer retains its legacy stroke fallback.

Each port may store `fittings[port.id]={type:'straight'|'45'|'90',rotation:<degrees>}`. Angled connectors calculate a normal from the component surface, construct a tangent basis and rotate the 45/90 degree outlet about that normal. Tubes connect to the **free end of the swivel**, not the origin of the port fitting. The component editor exposes the angle and rotation individually for every port, including water blocks. Reservoir top fill/vent ports do not admit circulating tubing. Approximate fitting lengths, orientation and compression/collar shapes are not manufacturer machining references. The cost estimate includes base compression and optional angled adapters.

Regression coverage: `node tests/route-collision-check.mjs`, plus existing WebGL, routing and component suites. Project JSON format is `walnut-loop-v21` with greenfield no-migrations policy.

## v0.22 — flattened GPU block, PCB proxy, and walnut support

GPU: **PowerColor Reaper RX 9070 XT**, Alphacool Core RX 9070 XT Hellhound + Pure, **#14782**. Actual published cooler outside dimensions **197 × 127.33 × 33.35 mm (L × W × H)**; published backplate dimensions **197 × 98.8 × 6 mm**. The exposed PCB is inferred to be approximately **197 × 98.8 × 1.6 mm** but **not manufacturer-measured**. Reference: https://shop.alphacool.com/en/shop/gpu-water-cooling/amd/14782-alphacool-core-rx-9070-xt-hellhound-pure-with-backplate .

GPU world-space default: `pos=[-91,524.275,-120.95]`, `size=[127.33,33.35,197]`. It is horizontal in the X–Z plane with video I/O facing case/rear -Z, PCIe fingers on -X, and two modeled working G1/4 ports on +X at `port.off=[63.665,8,-17]` and `[63.665,8,17]` (34 mm separation, planning approximation). Fitting normals for GPU are +X, not +Y. Additional physical threads in the block terminal are not plumbed in this conceptual model.

The motherboard tray center is `[8.57,492.775,-69.525]`, nominal sheet footprint **276.86 × 323.85 mm**. The ITX board's new X center is **62 mm**, so its right edge meets the tray's right edge (147 mm). The GPU outer block runs X -154.665 to -27.335, leaving a **4.335 mm X gap** to the motherboard left edge at -23. The aluminum tray's left edge is X -129.86. Hence the cooler hangs **24.805 mm beyond the metal tray**, approximately to the left of the rear sheet-metal panel (which extends farther left). An **8 mm walnut platform** under the PCB/backplate is modeled as a conceptual support. The platform needs physical attachment; verify metal flange, backplate dimensions, and fitting clearance in an actual test fit. No automatic fastener design is implied.

`gpuPoseForTray` attaches the GPU to the rear-left region of the tray with a 12 mm rear inset and a nominal 6 mm platform-to-GPU lift. `alignGPUToTray` resets that position. The GPU follows tray movement through `mountedTo='tray'`, while CPU block follows the ITX motherboard. The detailed GPU drawing is handled by `renderGPU` in `assets/part-geometry.js`: walnut support, approximate PCB, backplate, cooling block, right terminal, rear output bracket and left PCIe gold fingers. Collision bounds consider the full water-block envelope; port fitting clearance still needs inspection. The existing route generator passes its major-component collision check in dual mode for all tubing styles with the updated block.

Regression test: `tests/gpu-layout-check.mjs`. Current JSON format: `walnut-loop-v22` (no migrations).

## v0.23 — fan collision bounds

The function `installedFans()` is the common source for drawing and colliding actual fan assemblies. Every panel and inner fan on visible radiators, as well as fan-only units in open bays, gets a distinct padded `120 × 120 × case.fanThickness` mm AABB through `WalnutLoopRouting.fanBoxes`. IDs include radiator/slot, face, row. `routeObstacles` uses these for automatic and manual routes and **does not exempt fans attached to a radiator endpoint**. Fan collision inflation is `tubeOD/2 + 2 mm`, slightly tighter than general-purpose component inflation because measured radiator end-tank ports are close to top-row fan frames. Changing fan counts, removing a radiator, or configuring free-bay fans updates obstacles. This is a simplified envelope, not blade/grill CAD. Test: `tests/fan-clearance-check.mjs`.

## v0.24 — tube occupancy, 45° opt-in and top GPU ports (current)

Route generation reserves the geometry of accepted earlier tubes, including actual rendered fallback geometry when curved tubing fails a clearance check. An AABB approximation of short tube pieces is used only for guiding route search, while actual acceptance and interactive collision warnings test 3D segment-to-segment distance for both tube centerlines, requiring approximately tube diameter + 2 mm. The nearby common tee-port region (within ~55 mm) is a schematic overlap exemption. Routing can fail in crowded areas; flagged routes are intentionally not drawn. This is **not** complete CAD collision or a fabricated tee fitting model.

The `allowAuto45` checkbox is **off by default**; sample generation applies automatically tagged 45° fittings only to unconfigured block outlet ports when enabled. Disabling deletes only automatically generated adapters. Manual straight, 45°, and 90° swivel selections remain available.

**GPU port correction:** Alphacool GPU block terminal G1/4 connections are on the **top surface (+Y)** of the right-hand terminal, not on the right vertical side. Current world-local port offsets are `[49.4,17.675,-17]` and `[49.4,17.675,17]` mm; nominal port Z spacing 34 mm. Fitting normals are +Y; matching G1/4 ring geometry is in the X-Z plane. This corrects the obsolete +X port direction in v0.22 historical notes above.

Test: `tests/tube-separation-check.mjs`. JSON project format: `walnut-loop-v24`.
