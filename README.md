# Walnut Loop Lab

A standalone, browser-based 3D-style planner for a custom walnut PC water-cooling case.

**Status:** v0.9 prototype. The cabinet dimensions come from physical measurements, but radiator sizes, assembly depths, ports, and component positions are partly provisional. **Do not use model coordinates as finished cutting or tubing measurements.**

## Features

- Isometric, front, side and top views; Canvas renderer on desktop and SVG renderer for mobile Safari
- Two solid, ¾-inch-thick walnut front/rear panels with four measured fan cutouts and two matching upper windows
- Six correctly oriented front-to-back walnut support rails and a metal center divider
- **Cooling assemblies:** assign radiators to one of four fan openings, attach 0–3 fans on each side, and preview 120-mm fan frames and rotor details
- **Fan-only openings:** install 0–3 fans in a bay without a radiator
- Adjustable radiator dimensions, positions, fan thickness, ports, coolant routes, tubing styles and cost allowances
- Save and restore configurations as JSON; export the current view
- Local browser persistence and a static fallback drawing for browsers that block scripts

## Cooling assembly workflow

1. Open **Components**, choose an existing radiator (Front/right, Front/left or Third radiator).
2. Set its **Attach radiator to fan opening** slot: front/rear and left/right, or **Not installed**.
3. Set **Between panel and radiator** and **Other side of radiator** to 0, 1, 2 or 3 fans. For instance, **3 + 3** means six fans in push/pull. **3 + 0** means three fans on one side. For two fans, the viewer shows the upper and lower positions; for one fan, the center.
4. Under **Fan-only openings**, select a count for any unoccupied bay (e.g. a 3-fan airflow-only bank).
5. Use **Show cooling assemblies in 3D** to leave Case-only mode. Select different views or drag the model to inspect stack depth. **Empty bay guides** toggles outlines of the available fan-bank apertures.

Each radiator retains its attached fan counts when moved to another opening. The fan-only setting for a bay is remembered but is hidden while that bay has a radiator. Moving a radiator to a different bay doesn't reset unrelated radiator positions. Fan objects are included in the imported/exported project JSON; existing v0.8 browser data is upgraded automatically, defaulting older radiator setups to three panel-side fans and none on the opposite side.

**Initial sample layout:** Radiator 1 on the front/right opening and Radiator 2 on the rear/right opening, each with **3 + 3** fans. The front/left and rear/left openings start with three fan-only frames apiece. Radiator 3 is unmounted. Imported and saved projects retain their own bay assignments.

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

## Accuracy and safety

The planner does not yet check physical collisions, mounting fastener positions, realistic bends, or tube engagement depths. Verify all clearances and flow arrangements on the real machine before drilling, cutting, filling, or powering hardware. This is a public repository and public website.
