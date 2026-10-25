# Walnut Loop Lab

A 3D-style browser-based tubing planner for a custom walnut PC water-cooling case, developed from measurements of the physical build.**Status:** v0.7 prototype. Case dimensions are partly measured, while some mounting locations, ports, cutouts and tubing calculations are preliminary. **Do not use the reported lengths as final cutting measurements.**

## Features
- Interactive isometric/front/side/top cabinet viewer, SVG renderer for iOS and Canvas alternative
- Structural cabinet with solid front and rear pierced panels, six flat front-to-back walnut support rails,central metal divider, four fan openings and two upper windows
- Adjustable component positions and coolant ports
- Soft tube, hard tube bends and elbow route previews
- Estimated tube length, elbows, compression fittings and costs
- Project JSON import/export and view export
- Static preview when JavaScript isn't available

## Run and publish
This is a static site: no server, dependencies, build tools, external scripts, or credentials are required.

The repository default branch is **`Production`** (not `main`).

To enable GitHub Pages go to **Settings → Pages → Build and deployment**, select **Deploy from a branch**, select **`Production`** and **`/(root)`**, then Save.

Published URL (after Pages is enabled):
https://CodyMathis123.github.io/walnut-loop-lab/

Locally, run `python3 -m http.server 8000` in this directory and open http://localhost:8000. Loading the HTML directly in an iOS file preview may disable JavaScript; use the Pages URL instead.

## Structure
- `index.html` — page layout
- `assets/style.css` — presentation and responsive layout
- `assets/app.js` — geometry, rendering and tubing calculations
-`assets/case-preview.svg` — updated static fallback (prior WebP retained)
- `docs/case-geometry.md` — known dimensions and open measurements
- `.nojekyll` — no Jekyll processing required## Measured openings added October 25, 2026
- Four approximately 122 × 362 mm lower fan openings, with 3.25-inch bottom and 1.75-inch nearest-side offsets.
- Front and rear upper windows: 3.5-inch side insets, 1.5-inch top inset, 8.5-inch height (13-inch calculated width).
- Measurements are modeled from the 20-inch end-panel edges, not the 21.5-inch outer case. Geometry settings remain editable.
- Existing stored v0.6 projects migrate old default fan dimensions without overwriting customized values. After an upgrade, use **Align radiators to their fan openings** if needed.

## Accuracy and safety
Schematic routing does not yet detect physical collisions or compute manufacturer-specific bend allowances, end engagement depths or required cable clearances. Test real physical fit before cutting, assembling or applying power. This repository and its Pages website are public.
