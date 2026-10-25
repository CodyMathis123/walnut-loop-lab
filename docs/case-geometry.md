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

**Fresh-project sample:** front/right and rear/right radiators each use 3 panel-side + 3 inner-side fans (12 radiator fans). Front/left and rear/left openings each use a 3-fan-only bank (6 more). These are editable starting values, not verified permanent placements; browser-saved configurations are preserved.

## Editor display and depth sorting (v0.10)

- The model uses a single painter-style sorted list of front/rear walnut-panel surfaces, inner cutout faces, radiator and fan faces, optional other components, and their detail strokes.
- **Cooling view** hides provisional motherboard, CPU/GPU, reservoir, pump and drain geometry without removing any components or saved tubing routes. **Other parts** reveals them. Existing project geometry and visibility flags are preserved.
- The steel divider is rendered as an opaque dark panel; the cutout panels use even-odd polygon holes.
- This improves visible occlusion but is *not a geometric collision solver*. Intersecting mesh faces, hard tubing, and fit tolerances are approximate.
- The normal editor keeps component and fan controls immediately visible. Geometry, route and cost settings are available inside expandable sections; explanatory history stays in repository documentation.
