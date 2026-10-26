# Walnut Loop Lab

An interactive, static-site 3D layout planner for a custom walnut PC water-cooling case. The live editor runs on GitHub Pages and uses Three.js/WebGL with Canvas/SVG fallback.

**Status: v0.25 — greenfield prototype.** The design intentionally starts from its current default configuration on every page refresh. **Browser edits are not auto-saved and old browser drafts are discarded.** Use **Export project JSON** only when you want to keep an explicit current-version snapshot; **Import JSON** accepts v0.25-format projects only. There is **no backward-compatibility or automatic migration layer.**

[Open the live planner](https://codymathis123.github.io/walnut-loop-lab/)

## v0.25 — physical port exits, walnut collision and stable tubing

**Allow 45° fittings** is a global permission, off by default. When disabled, both the manually configurable port menus and automatic generation permit only straight or 90° connectors. Enabling it makes 45° swivels available on any eligible component, but does not automatically add them. Turning it off converts existing 45° fittings to straight and preserves 90° fittings. Imports must obey the same rule.

Each tube now leaves a fitting **straight along its outlet axis**, with a fixed departure segment. For a rotated 90° connector, the fitting itself turns through a modeled arc and the tube exits tangent to that arc. The hose approaches its destination from the appropriate outward-facing direction. Free tube bends and soft-curve interpolation begin only *after* these fixed port departures, so no path can appear to connect from behind a port. The constrained lower reservoir outlet uses a shorter lead because a pump is immediately below it.

Automatic and manually edited routes now detect solid **walnut front/rear panels, the six structural rails, and the lower steel divider** as obstacles. The real fan apertures and upper windows remain open. The previous component, fan and tube-to-tube checks remain active. Unroutable samples are flagged instead of being depicted through solid wood; some constrained default routes now legitimately require manual fitting choices.

The WebGL pipe renderer now creates **16-sided circular tube rings using a continuous parallel-transport frame**, rather than reorienting the rings independently at each turn. This avoids apparent pinching. Tests measure the actual rendered radius on both sides of a right-angle turn.

The model is still a layout tool rather than fabrication-grade collision CAD.

## v0.25 — tube-to-tube spacing and upward-facing GPU ports

The automatic generator now routes **sequentially**, reserving space for tubes it already placed. It tests tubing against both components/fans and other tubing, using conservative route-search envelopes followed by actual **3D centerline-to-centerline distance checks** with the selected outside diameter and an additional 2 mm gap. Previously accepted tube geometry remains stable as later paths are generated, including when soft curves must fall back to a safer straight segment. Manual route edits are checked against other tubes too; colliding paths are marked **Clearance needed**.

Shared tee junctions are allowed to merge near a common port for their first ~55 mm only. That is a schematic routing exception, not a modeled physical tee fitting. **A route that cannot be placed safely is flagged and omitted from rendering rather than drawn through another tube.** All nine stock combinations (dual, single-right, single-left × soft, hard bends, hard elbows) generate clear sample tubes in regression tests. Custom configurations can still produce flagged routes that require manual adjustment.

**Allow automatic 45° fittings** is a new tubing-setting checkbox, **off by default**. When enabled, sample generation can place 45° swivel outlets on unconfigured CPU/GPU outlet ports; disabling it removes only those automatically generated fittings. Manually configured straight, 45°, or 90° fittings are untouched.

The GPU block's two G1/4 ports now sit **on top (+Y)** of its right-hand terminal (schematic positions X +49.4 mm, Y +17.675 mm, Z ±17 mm relative to the block center). Both compression fittings point upward until the user selects an angled swivel. This supersedes the previous incorrect +X/right-side port representation.

## v0.25 — route clearance, cylindrical tubes, and swivel compression fittings

**Automatic route generation now avoids modeled component envelopes**, rather than blindly following an X/Y/Z order through the motherboard, GPU, tray, radiators or pump/reservoir assemblies. A bounded 3D search finds detours with a configurable clearance margin around conservative axis-aligned bounds. When the selected axis order is already clear, it remains unchanged. Generated routes that cannot find a safe path are **flagged in the route list and not drawn**, rather than being depicted through hardware. Manually edited route paths are rechecked; intersections are labeled **Clearance needed** and shown in a warning color so their control points can be repositioned.

**Tube geometry is actually cylindrical:** the WebGL renderer generates round, depth-tested triangle meshes at the selected outside diameter, with visible surface shading and metal compression fittings. The original 2D Canvas/SVG path still draws lines as a fallback on unsupported devices. Clicking/draggng waypoints remains available.

For each component in **Components → Port positions**, select an individual port's compression fitting:

- **Straight** compression fitting (default).
- **45° swivel** and a numerical swivel rotation, in degrees.
- **90° swivel** and a numerical swivel rotation, in degrees.

The fitting is shown physically on the port, even before a hose is attached. Its outlet direction and the connected tube's endpoint update with the rotation. The assembly can be configured separately on each CPU/GPU block, radiator, pump, drain or reservoir port. Reservoir *top fill/vent ports* are excluded from circulating routes and these fitting controls. The estimate counts port compression nuts plus optional angled adapters separately from route elbows.

**Collision-scope caveat:** checks cover conservative rectangular envelopes of the major modeled components and tubing diameter, not every walnut rail, fan-blade, bracket hole, other tubing run or real-world bend fabrication limitation. Connections at the source and destination components are exempted from their own body envelopes. If the planner flags a route, adjust placement or edit control points; do not treat a visually clear result as guaranteed physical fit.

## v0.25 — Reaper RX 9070 XT on the tray

The **PowerColor Reaper RX 9070 XT** is modeled horizontally alongside the Mini-ITX motherboard using the compatible **Alphacool Core RX 9070 XT Hellhound + Pure #14782**. Alphacool's published overall block dimensions are **197 × 127.33 × 33.35 mm (length × width × thickness)**. The **197 × 98.8 mm backplate** is used as a stand-in for the otherwise unconfirmed GPU PCB footprint; the air-cooled shroud dimensions are intentionally *not* used.

With rear video outputs facing **-Z** (the rear panel), the PCIe gold-finger edge on **-X** (left), and the waterblock's two active inlet/outlet connectors on **+X** (right), the card lays next to the right-side GIGABYTE 170 × 170 mm AM4 board. The block itself is modeled at full dimensions with a right-edge terminal, chrome/copper and acrylic-like surfaces, separate PCB/backplate, gold PCIe edge and an I/O bracket containing display connectors.

The motherboard is right-aligned to the 276.86 mm tray (its right edge meets the tray's right edge). The block's widest edge is about **4.3 mm** from the motherboard's left edge in top-down projection. The full block exceeds the **left edge of the bare metal motherboard tray by about 24.8 mm**, so the assembly includes a conceptual **8 mm walnut platform** that overlaps/overhangs the metal support. Its clearance and attachment hardware require physical verification; this should not be interpreted as a confirmed zero-interference design, especially when fittings are installed on the GPU's right edge.

Selecting the GPU under **Components** displays its measured block dimensions, PCB proxy, platform overhang and motherboard edge gap. Use **Align GPU to rear of tray** to restore its placement. The GPU is attached to the movable tray, so tray shifts also move the GPU and motherboard in concert. Tube routing and compression-fitting normals now use **upward-facing** (+Y) ports on top of the block's right-hand terminal. Existing CPU/GPU dual or shared loop options are unchanged.

Sources: [Alphacool #14782 technical specifications](https://shop.alphacool.com/en/shop/gpu-water-cooling/amd/14782-alphacool-core-rx-9070-xt-hellhound-pure-with-backplate) and [official compatibility datasheet](https://download.alphacool.com/datasheet/ENG_14782_Alphacool_Core_RX_9070_XT_Hellhound__Pure_with_Backplate_datasheet.pdf).

## v0.25 — fan-aware tubing clearance

Tubing routes now account for **every installed fan frame (120 × 120 mm × configured thickness)**. This includes both push/pull fans on each radiator and bare fans in empty openings. The renderer and collision checker use the same positions, so changing fan counts or radiator presence updates the routing obstacles immediately.

The router uses tube radius plus **2 mm** of fan clearance. This is deliberately tighter than the generic component margin because the radiator ports are roughly 11 mm above the nearest upper fan edges. The endpoint radiator body remains exempt during routing, but its attached fans do not. The generated route and dragged tubing collision warnings both account for fans.

This uses a conservative full-frame envelope; individual fan blade geometry, grills, fasteners and the rear motherboard-tray fan opening (which has no installed fan modeled) are not yet obstacles.

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
| GPU | Alphacool #14782 full-size block on PowerColor Reaper; PCB proxy on overhanging walnut tray platform, top-facing coolant ports on right terminal, PCIe left, rear displays |

The motherboard and water block move with the tray when repositioning the assembly. The motherboard can be re-aligned using **Align motherboard + CPU**. The tray is kept **3 mm above the middle support** to avoid intersections; the motherboard has a nominal **6.35 mm standoff clearance**. The radiator's two G1/4-style ports are rendered on the **inward-facing vertical surface** of the upper end tank, not on its top.

## Sample routes and reservoir ports (v0.25)

**Generate example routes** uses the selected **Tube style** and **Auto route order** controls, producing the same topology for soft tubing, hard tubing with rounded bends, or hard tubing with elbows. The example generator follows the chosen cooling mode (dual, right-side shared, or left-side shared).

For either FrozenQ reservoir, the two bottom G1/4 ports are used for coolant return and pump supply. The upper port is **fill/vent only** and is intentionally **not available as a tubing endpoint**. It remains visible in the 3D model so it can be recognized as a fill point. The generator, manual add-route handler and v0.25 import validation all enforce this rule. As before, low-point drains are capped branch tees, not normal flow-through components.

## Configurable loop hardware and 3D tubing editor (v0.25)

**Cooling loops** offers two independent loops (GPU on the left and CPU on the right), or **one shared loop** using *either* the right/primary CPU-side pump/reservoir/drain or the left-side pump/reservoir/drain. In shared mode, the inactive hardware set is hidden; all four installed radiators remain available to the shared loop. Switching layouts clears example tubing paths after confirmation, so the new circuit does not accidentally reuse incompatible connections.

Each FrozenQ reservoir now has **three physical ports:** two distinct ports on its lower end cap (bottom return and bottom pump supply) and a third on its upper cap (fill/vent). Both reservoirs still independently switch from vertical to horizontal. Ports turn with the reservoir and are individually selectable for tube connections. These are approximate schematic connector locations, not verified physical dimensions.

The tubing route editor now supports actual interactive **world-space control points**:

- Pick two ports and add a tube, or generate conceptual example loops.
- Click on the drawn tube to insert a control point, and drag it to reshape the 3D path. Select an existing gold handle to adjust it without orbiting the camera.
- Hold **Shift while dragging** a point to adjust depth; otherwise dragging follows the camera-facing horizontal/vertical directions.
- **Soft tubing** interpolates a smooth curve through the handles; **hard with bends** rounds corners using the bend-radius input; **hard with elbows** retains sharp turns and counts fittings.
- Use **+ Bend point**, **Remove point**, or **Reset path** for the selected route. Both connection endpoints stay attached to hardware ports as parts are moved.
- Bend locations, route style and port endpoints are saved only in an explicitly exported v0.25 JSON snapshot; no browser autosave.

**Limitations:** Conservative component bounding-box collision avoidance is included, but this is not full CAD collision detection, a physics-based soft hose simulator, or proof of achievable hard-tube bends. Confirm bend radii, port orientation, clearance and priming/drain behavior against real components.

## Editor functionality

- Orbit, zoom, and focus components; view 3D WebGL with optional Canvas/SVG fallback.
- Move parts and edit sizes, radiator slots, fan counts, tubing paths, and cost estimates.
- Switch **Dual GPU/CPU loops** or **Single shared loop**. Dual mode prevents cross-loop route connections; the single mode hides the spare right-side reservoir/pump/drain set.
- Independently rotate each reservoir between vertical and horizontal; ports rotate with the body.
- Adjust the tray CPU-backplate opening and align the rear bracket to the walnut window.
- Generate conceptual tubing routes with low-point capped drain branches. They are *not* validated plumbing or a collision-free routing design.
- Export a v0.25 JSON snapshot, import a v0.25 snapshot, export a PNG/SVG view, or reset the current sample.

**Prototype workflow:** Revisit or refresh to see the newest defaults. Nothing you edited previously will silently override new code changes. If you deliberately export and later import a snapshot, it must belong to the current project format.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Layout, controls, and pinned Three.js import map |
| `assets/app.js` | Editor model, placement logic, scene generation, loop controls, routes, import/export |
| `assets/part-geometry.js` | Tray, radiator, cylindrical reservoir, and Gigabyte ITX geometry |
| `assets/route-geometry.js` | Conservative AABB route planning and rotatable fitting endpoints |
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
node tests/tubing-editor-check.mjs
node tests/route-collision-check.mjs
node tests/gpu-layout-check.mjs
node tests/fan-clearance-check.mjs
node tests/tube-separation-check.mjs
node tests/physical-port-clearance-check.mjs
node tests/webgl-smoke-check.mjs
```

GitHub Actions runs the same suite. GitHub Pages deploys directly from the `Production` branch; there is no build step.

## Sources and model assumptions

- [GIGABYTE X570 I AORUS PRO WIFI](https://www.gigabyte.com/Motherboard/X570-I-AORUS-PRO-WIFI-rev-10): 170 × 170 mm AM4 Mini-ITX board. Socket coordinate and decorative chip placement in this model are **approximate visual references**, not verified drill coordinates.
- [Mountain Mods ATX removable motherboard tray](https://www.mountainmods.com/atx_tray_anodized_black) and [120 mm tray assembly](https://www.mountainmods.com/MountainMods-Modular-Removable-Motherboard-Tray-Assembly%28ATX%29-120-Black-Wrinkle): base tray and connected rear panel.
- Original user measurements of the walnut case and user-provided Gigabyte motherboard photo.
- TFC X-Changer-style 360 mm radiators are represented as nominal **135 × 380 × 60 mm** bodies with recessed fins, end tanks, and approximate port spacing.

**Not CAD or fabrication-grade data.** Confirm radiator clearance, fasteners, exact standoffs, pump priming/flooded inlets, drain accessibility, fan direction, water block fit and tubing routes using real hardware before drilling or filling a loop.
