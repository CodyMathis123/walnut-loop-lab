# Walnut Loop Lab

An interactive, static-site 3D layout planner for a custom walnut PC water-cooling case. The live editor runs on GitHub Pages and uses Three.js/WebGL with Canvas/SVG fallback.

**Status: v0.21 — greenfield prototype.** The design intentionally starts from its current default configuration on every page refresh. **Browser edits are not auto-saved and old browser drafts are discarded.** Use **Export project JSON** only when you want to keep an explicit current-version snapshot; **Import JSON** accepts v0.21-format projects only. There is **no backward-compatibility or automatic migration layer.**

[Open the live planner](https://codymathis123.github.io/walnut-loop-lab/)

## v0.21 — route clearance, cylindrical tubes, and swivel compression fittings

**Automatic route generation now avoids modeled component envelopes**, rather than blindly following an X/Y/Z order through the motherboard, GPU, tray, radiators or pump/reservoir assemblies. A bounded 3D search finds detours with a configurable clearance margin around conservative axis-aligned bounds. When the selected axis order is already clear, it remains unchanged. Generated routes that cannot find a safe path are **flagged in the route list and not drawn**, rather than being depicted through hardware. Manually edited route paths are rechecked; intersections are labeled **Clearance needed** and shown in a warning color so their control points can be repositioned.

**Tube geometry is actually cylindrical:** the WebGL renderer generates round, depth-tested triangle meshes at the selected outside diameter, with visible surface shading and metal compression fittings. The original 2D Canvas/SVG path still draws lines as a fallback on unsupported devices. Clicking/draggng waypoints remains available.

For each component in **Components → Port positions**, select an individual port's compression fitting:

- **Straight** compression fitting (default).
- **45° swivel** and a numerical swivel rotation, in degrees.
- **90° swivel** and a numerical swivel rotation, in degrees.

The fitting is shown physically on the port, even before a hose is attached. Its outlet direction and the connected tube's endpoint update with the rotation. The assembly can be configured separately on each CPU/GPU block, radiator, pump, drain or reservoir port. Reservoir *top fill/vent ports* are excluded from circulating routes and these fitting controls. The estimate counts port compression nuts plus optional angled adapters separately from route elbows.

**Collision-scope caveat:** checks cover conservative rectangular envelopes of the major modeled components and tubing diameter, not every walnut rail, fan-blade, bracket hole, other tubing run or real-world bend fabrication limitation. Connections at the source and destination components are exempted from their own body envelopes. If the planner flags a route, adjust placement or edit control points; do not treat a visually clear result as guaranteed physical fit.

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

## Sample routes and reservoir ports (v0.21)

**Generate example routes** uses the selected **Tube style** and **Auto route order** controls, producing the same topology for soft tubing, hard tubing with rounded bends, or hard tubing with elbows. The example generator follows the chosen cooling mode (dual, right-side shared, or left-side shared).

For either FrozenQ reservoir, the two bottom G1/4 ports are used for coolant return and pump supply. The upper port is **fill/vent only** and is intentionally **not available as a tubing endpoint**. It remains visible in the 3D model so it can be recognized as a fill point. The generator, manual add-route handler and v0.21 import validation all enforce this rule. As before, low-point drains are capped branch tees, not normal flow-through components.

## Configurable loop hardware and 3D tubing editor (v0.21)

**Cooling loops** offers two independent loops (GPU on the left and CPU on the right), or **one shared loop** using *either* the right/primary CPU-side pump/reservoir/drain or the left-side pump/reservoir/drain. In shared mode, the inactive hardware set is hidden; all four installed radiators remain available to the shared loop. Switching layouts clears example tubing paths after confirmation, so the new circuit does not accidentally reuse incompatible connections.

Each FrozenQ reservoir now has **three physical ports:** two distinct ports on its lower end cap (bottom return and bottom pump supply) and a third on its upper cap (fill/vent). Both reservoirs still independently switch from vertical to horizontal. Ports turn with the reservoir and are individually selectable for tube connections. These are approximate schematic connector locations, not verified physical dimensions.

The tubing route editor now supports actual interactive **world-space control points**:

- Pick two ports and add a tube, or generate conceptual example loops.
- Click on the drawn tube to insert a control point, and drag it to reshape the 3D path. Select an existing gold handle to adjust it without orbiting the camera.
- Hold **Shift while dragging** a point to adjust depth; otherwise dragging follows the camera-facing horizontal/vertical directions.
- **Soft tubing** interpolates a smooth curve through the handles; **hard with bends** rounds corners using the bend-radius input; **hard with elbows** retains sharp turns and counts fittings.
- Use **+ Bend point**, **Remove point**, or **Reset path** for the selected route. Both connection endpoints stay attached to hardware ports as parts are moved.
- Bend locations, route style and port endpoints are saved only in an explicitly exported v0.21 JSON snapshot; no browser autosave.

**Limitations:** Conservative component bounding-box collision avoidance is included, but this is not full CAD collision detection, a physics-based soft hose simulator, or proof of achievable hard-tube bends. Confirm bend radii, port orientation, clearance and priming/drain behavior against real components.

## Editor functionality

- Orbit, zoom, and focus components; view 3D WebGL with optional Canvas/SVG fallback.
- Move parts and edit sizes, radiator slots, fan counts, tubing paths, and cost estimates.
- Switch **Dual GPU/CPU loops** or **Single shared loop**. Dual mode prevents cross-loop route connections; the single mode hides the spare right-side reservoir/pump/drain set.
- Independently rotate each reservoir between vertical and horizontal; ports rotate with the body.
- Adjust the tray CPU-backplate opening and align the rear bracket to the walnut window.
- Generate conceptual tubing routes with low-point capped drain branches. They are *not* validated plumbing or a collision-free routing design.
- Export a v0.21 JSON snapshot, import a v0.21 snapshot, export a PNG/SVG view, or reset the current sample.

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
node tests/webgl-smoke-check.mjs
```

GitHub Actions runs the same suite. GitHub Pages deploys directly from the `Production` branch; there is no build step.

## Sources and model assumptions

- [GIGABYTE X570 I AORUS PRO WIFI](https://www.gigabyte.com/Motherboard/X570-I-AORUS-PRO-WIFI-rev-10): 170 × 170 mm AM4 Mini-ITX board. Socket coordinate and decorative chip placement in this model are **approximate visual references**, not verified drill coordinates.
- [Mountain Mods ATX removable motherboard tray](https://www.mountainmods.com/atx_tray_anodized_black) and [120 mm tray assembly](https://www.mountainmods.com/MountainMods-Modular-Removable-Motherboard-Tray-Assembly%28ATX%29-120-Black-Wrinkle): base tray and connected rear panel.
- Original user measurements of the walnut case and user-provided Gigabyte motherboard photo.
- TFC X-Changer-style 360 mm radiators are represented as nominal **135 × 380 × 60 mm** bodies with recessed fins, end tanks, and approximate port spacing.

**Not CAD or fabrication-grade data.** Confirm radiator clearance, fasteners, exact standoffs, pump priming/flooded inlets, drain accessibility, fan direction, water block fit and tubing routes using real hardware before drilling or filling a loop.
