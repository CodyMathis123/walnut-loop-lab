# Walnut Loop Lab

A standalone, browser-based 3D-style planner for a custom walnut PC water-cooling case.

**Status:** v0.12 prototype. The cabinet dimensions come from physical measurements, but radiator sizes, assembly depths, ports, and component positions are partly provisional. **Do not use model coordinates as finished cutting or tubing measurements.**

## Features

- Isometric, front, side and top views; Canvas renderer on desktop and SVG renderer for mobile Safari
- Two solid, ¾-inch-thick walnut front/rear panels with four measured fan cutouts and two matching upper windows
- Six correctly oriented front-to-back walnut support rails and a metal center divider
- **Cooling assemblies:** assign radiators to one of four fan openings, attach 0–3 fans on each side, and preview 120-mm fan frames and rotor details
- **Fan-only openings:** install 0–3 fans in a bay without a radiator
- Adjustable radiator dimensions, positions, fan thickness, ports, coolant routes, tubing styles and cost allowances
- Save and restore configurations as JSON; export the current view
- Local browser persistence and a static fallback drawing for browsers that block scripts

## Editor layout and rendering (v0.12)

The interactive page now prioritizes **Components** and **Fan-only openings**. Case dimensions, tubing routes, and tubing estimates remain available in collapsed sections rather than showing all reference notes on every page load. Measurement history, assumptions, and unverified dimensions belong here and in `docs/case-geometry.md`, not in the everyday editor UI.

**Rendering architecture:** The viewer now defaults to [Three.js 0.186.1](https://threejs.org/) and a real WebGL per-pixel depth buffer. The custom Canvas/SVG painter renderer remains available as a fallback. The library is loaded from a version-pinned jsDelivr ES-module URL using a browser import map; no build step is necessary. If loading the library or starting WebGL fails, the original viewer remains interactive.

The GPU backend receives the *same world-space geometry* as the existing editor, avoiding any duplication of cabinet measurements, component placement, or saved project formats. Faces are batched by material into buffers, using depth testing and opaque depth writing. GPU meshes are cached while orbiting and rebuilt only after model changes. The WebGL display preserves the editor's existing camera math and gesture controls, and can export PNG.

Use the **3D: WebGL** control to enable/disable hardware depth rendering. Canvas/SVG remains available using the fallback control.

Official references: [installation](https://threejs.org/manual/pages/installation.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer), and [material depth testing](https://threejs.org/docs/pages/Material.html).

### Legacy renderer

The fallback viewer uses **one shared depth-sorted face queue** for the wood panels, their through-cut apertures, the center divider, fans, radiator bodies and optional internal hardware. The solid front/rear panels are subdivided into opaque face tiles bordering each opening, improving depth sorting relative to inset fans. This avoids the previous behavior in which entire component groups were painted over a finished shell, regardless of their actual front/back positions. It is still a painter's-algorithm preview, not a true 3D engine with a depth buffer, collision detection, or boolean subtraction between arbitrary intersecting components.

The **Cooling view** focuses on radiators and fan assemblies. **Other parts** shows the provisional motherboard tray, CPU/GPU, pump, reservoir and drain. Existing projects retain their component positions and saved configurations; the new viewport filter defaults to cooling-only for older projects so those provisional internals no longer clutter the preview. Port markers are off in new projects but preserve their saved setting in older projects.

## Cooling assembly workflow

1. Open **Components**, choose Radiator 1, 2, 3 or 4.
2. Set its **Attach radiator to fan opening** slot: front/rear and left/right, or **Not installed**.
3. Set **Between panel and radiator** and **Other side of radiator** to 0, 1, 2 or 3 fans. For instance, **3 + 3** means six fans in push/pull. **3 + 0** means three fans on one side. For two fans, the viewer shows the upper and lower positions; for one fan, the center.
4. Under **Fan-only openings**, select a count for any unoccupied bay (e.g. a 3-fan airflow-only bank).
5. Use **Show cooling assemblies in 3D** to leave Case-only mode. Select different views or drag the model to inspect stack depth. **Empty bay guides** toggles outlines of the available fan-bank apertures.

Each radiator retains its attached fan counts when moved to another opening. The fan-only setting for a bay is remembered but is hidden while that bay has a radiator. Moving a radiator to a different bay doesn't reset unrelated radiator positions. Fan objects are included in the imported/exported project JSON; existing v0.8 browser data is upgraded automatically, defaulting older radiator setups to three panel-side fans and none on the opposite side.

**Initial sample layout:** Four 360 mm radiators — one in each front/rear left/right opening — with **3 + 3** fans apiece (24 fan frames total). Each panel-facing 25.4 mm fan is nested into the 122 × 362 mm opening, with its exterior face flush with the walnut outside surface; the rest of its depth extends into the cabinet. The four radiator assemblies can be individually unmounted or hidden, and their 0–3 fan counts on each side can be changed.

**Existing saved projects** retain customized assignments and counts, with Radiator 4 appended if missing. Old auto-positioned fan stacks migrate into the cutout; manually modified radiator Z positions are kept. Use **Preset: 4 radiators · 3+3 fans** to explicitly apply the new four-radiator starting configuration to an existing project, or Reset sample to restore all defaults.

**Important assumptions:** Each radiator is approximated as a rectangular body (starter size 135 × 380 × 64 mm). Fans are shown at 120 × 120 mm with editable global thickness (initially 25.4 mm). Radiator mounting distances, actual fan frames and air direction are provisional. The controls currently model fan quantity and mounting sides, not verified airflow arrows, screw holes, or manufacturer-specific fit.

## Cabinet measurements

- Exterior: **21½″ wide × 20″ deep × 29″ tall**, including two ¾″ side doors
- Lower fan apertures: approximately **122 × 362 mm**, 3¼″ above the bottom and 1¾″ in from the nearest end-panel side
- Upper matching front/rear windows: **13″ wide × 8¼″ high**, 3½″ in from either side and 1½″ below the top
- The window bottoms meet the middle support at **19¼″** above the case bottom
- Radiator port-height references: approximately 18¼″ above the case bottom

Details and open questions: [docs/case-geometry.md](docs/case-geometry.md).

## Run and publish

This project needs no build step, external scripts, external services or credentials.

To develop locally, run `python3 -m http.server 8000` from the repository root and visit http://localhost:8000.

To run the JavaScript/HTML smoke test with Node.js:

```sh
node tests/smoke-check.mjs
node tests/webgl-smoke-check.mjs
```

GitHub Pages publishes from the `Production` branch and repository root:

https://CodyMathis123.github.io/walnut-loop-lab/

For iOS, visit the Pages site instead of using a local file preview, which may block scripts.

## Repository structure

- `index.html` — controls and layout
- `assets/app.js` — modeling, renderer, components, routing, saving
- `assets/style.css` — layout and responsive controls
- `assets/case-preview.svg` — static fallback
- `docs/case-geometry.md` — dimensional reference
- `tests/smoke-check.mjs` — DOM wiring and cooling configuration regression checks
- `tests/webgl-smoke-check.mjs` — GPU geometry/caching/depth settings tests with a mocked Three.js

## Accuracy and safety

The planner does not yet check physical collisions, mounting fastener positions, realistic bends, or tube engagement depths. Verify all clearances and flow arrangements on the real machine before drilling, cutting, filling, or powering hardware. This is a public repository and public website.
